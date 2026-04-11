import type {
  IAnyRecord,
  IAnyValue,
  INativeDocument,
  ITextPosition,
  ITextRange,
} from "./embind-contracts.js";
import type {
  IEditorGestureEvent,
  IEditorKeyEvent,
  IEditorMetadata,
  IEditorTextChange,
  ILanguageConfiguration,
  IVisibleLineRange,
} from "./editor-input-types.js";
import {
  DEFAULT_COMPLETION_DEBOUNCE_CHARACTER_MS,
  DEFAULT_COMPLETION_DEBOUNCE_INVOKED_MS,
  DEFAULT_DECORATION_OVERSCAN_VIEWPORT_MULTIPLIER,
  DEFAULT_DECORATION_SCROLL_REFRESH_MIN_INTERVAL_MS,
  DEFAULT_LINE_ANALYZE_CHUNK_BUDGET_MS,
} from "./legacy-defaults.js";

type TextInput = string | null | undefined;

interface IPoint {
  line: number;
  column: number;
}

type IRange = ITextRange;

interface ITextChange {
  range: IRange;
  oldText?: string;
  old_text?: string;
  newText?: string;
  new_text?: string;
}

type ITimeoutHandle = ReturnType<typeof setTimeout>;

interface IWasmLoadOptions {
  moduleFactory?: ((options: IAnyRecord) => IAnyValue | Promise<IAnyValue>) | IAnyValue;
  modulePath?: string;
  moduleOptions?: IAnyRecord;
}

interface ICompletionItemInit {
  label?: string;
  detail?: string | null;
  insertText?: string | null;
  insertTextFormat?: number;
  textEdit?: {
    range?: IRange;
    newText?: string;
  } | null;
  filterText?: string | null;
  sortKey?: string | null;
  kind?: number;
}

type IEnumFallback = Readonly<Record<string, number>>;

const FALLBACK_SPAN_LAYER = Object.freeze({
  SYNTAX: 0,
  SEMANTIC: 1,
});

const FALLBACK_INLAY_TYPE = Object.freeze({
  TEXT: 0,
  ICON: 1,
  COLOR: 2,
});

const FALLBACK_SEPARATOR_STYLE = Object.freeze({
  SINGLE: 0,
  DOUBLE: 1,
});

const FALLBACK_DIAGNOSTIC_SEVERITY = Object.freeze({
  DIAG_ERROR: 0,
  DIAG_WARNING: 1,
  DIAG_INFO: 2,
  DIAG_HINT: 3,
});

function resolveEnum<TEnum extends IEnumFallback>(
  moduleObj: IAnyRecord | null | undefined,
  enumName: string,
  fallback: TEnum,
): TEnum {
  const enumObj = (moduleObj?.[enumName] ?? null) as IAnyRecord | null;
  if (!enumObj || typeof enumObj !== "object") {
    return fallback;
  }
  const resolved: Record<string, number> = { ...fallback };
  Object.keys(fallback).forEach((key:string) => {
    if (!(key in enumObj)) {
      return;
    }
    const value = toFiniteNumber(enumObj[key]);
    if (value !== null) {
      resolved[key] = value;
    }
  });
  return Object.freeze(resolved) as TEnum;
}

function toFiniteNumber(value:IAnyValue) {
  if (value && typeof value === "object" && "value" in value) {
    const enumValue = Number(value.value);
    if (Number.isFinite(enumValue)) {
      return enumValue;
    }
  }

  const n = Number(value);
  if (Number.isFinite(n)) {
    return n;
  }
  return null;
}

function toInt(value:IAnyValue, fallback:IAnyValue = 0) {
  const n = toFiniteNumber(value);
  if (n === null) {
    return fallback;
  }
  return Math.trunc(n);
}

export function normalizeNewlines(text: TextInput): string {
  return String(text ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function hasLineBreak(text:string) {
  return /[\r\n]/.test(String(text ?? ""));
}

export function countLogicalLines(text: TextInput): number {
  const source = String(text ?? "");
  if (source.length === 0) {
    return 1;
  }

  let lines = 1;
  for (let i = 0; i < source.length; i += 1) {
    const code = source.charCodeAt(i);
    if (code === 10) {
      lines += 1;
      continue;
    }
    if (code === 13) {
      lines += 1;
      if (i + 1 < source.length && source.charCodeAt(i + 1) === 10) {
        i += 1;
      }
    }
  }
  return lines;
}

function asArray(value:IAnyValue) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value) {
    return [];
  }

  if (typeof value.size === "function" && typeof value.get === "function") {
    const size = Math.max(0, toInt(value.size(), 0));
    const out = [];
    for (let i = 0; i < size; i += 1) {
      out.push(value.get(i));
    }
    return out;
  }

  if (typeof value[Symbol.iterator] === "function") {
    try {
      return Array.from(value);
    } catch (_) {
      return [];
    }
  }

  return [];
}

function ensureLine(value:IAnyValue) {
  return Math.max(0, toInt(value, 0));
}

function ensureColumn(value:IAnyValue) {
  return Math.max(0, toInt(value, 0));
}

function ensureLength(value:IAnyValue) {
  return Math.max(0, toInt(value, 0));
}

function ensureRange(range:IAnyValue, fallbackPosition:IAnyValue = null) {
  if (range && range.start && range.end) {
    return {
      start: {
        line: ensureLine(range.start.line),
        column: ensureColumn(range.start.column),
      },
      end: {
        line: ensureLine(range.end.line),
        column: ensureColumn(range.end.column),
      },
    };
  }

  if (fallbackPosition && Number.isFinite(fallbackPosition.line) && Number.isFinite(fallbackPosition.column)) {
    return {
      start: {
        line: ensureLine(fallbackPosition.line),
        column: ensureColumn(fallbackPosition.column),
      },
      end: {
        line: ensureLine(fallbackPosition.line),
        column: ensureColumn(fallbackPosition.column),
      },
    };
  }

  return {
    start: { line: 0, column: 0 },
    end: { line: 0, column: 0 },
  };
}

function comparePosition(a:ITextPosition, b:ITextPosition) {
  if (a.line !== b.line) {
    return a.line - b.line;
  }
  return a.column - b.column;
}

function ensureEditRange(range:IAnyValue, fallbackPosition:IAnyValue = null) {
  const normalized = ensureRange(range, fallbackPosition);
  const start = normalized.start;
  const end = normalized.end;
  if (comparePosition(start, end) <= 0) {
    return normalized;
  }
  return {
    start: {
      line: end.line,
      column: end.column,
    },
    end: {
      line: start.line,
      column: start.column,
    },
  };
}

export function clampVisibleLineRange(
  start: number,
  end: number,
  totalLines: number,
  maxLineSpan:number = Number.POSITIVE_INFINITY,
): { start: number; end: number } {
  const total = Math.max(0, toInt(totalLines, 0));
  if (total <= 0) {
    return { start: 0, end: -1 };
  }

  let s = Math.max(0, toInt(start, 0));
  let e = Math.max(s, toInt(end, s));
  s = Math.min(s, total - 1);
  e = Math.min(e, total - 1);

  const maxSpan = Number(maxLineSpan);
  if (Number.isFinite(maxSpan)) {
    const limitedSpan = Math.max(1, toInt(maxSpan, 1));
    if ((e - s + 1) > limitedSpan) {
      e = Math.min(total - 1, s + limitedSpan - 1);
    }
  }

  return { start: s, end: e };
}

export function applyLineChangeToLines(
  lines: string[],
  range: IRange,
  newText: TextInput,
  options: { normalizeNewlines?: boolean } = {},
): void {
  if (!Array.isArray(lines)) {
    return;
  }

  const normalizedRange = ensureRange(range);
  if (lines.length === 0) {
    lines.push("");
  }

  let startLine = Math.max(0, toInt(normalizedRange.start.line, 0));
  let endLine = Math.max(0, toInt(normalizedRange.end.line, 0));
  let startColumn = Math.max(0, toInt(normalizedRange.start.column, 0));
  let endColumn = Math.max(0, toInt(normalizedRange.end.column, 0));

  if (startLine > endLine || (startLine === endLine && startColumn > endColumn)) {
    const swapLine = startLine;
    startLine = endLine;
    endLine = swapLine;

    const swapColumn = startColumn;
    startColumn = endColumn;
    endColumn = swapColumn;
  }

  startLine = Math.min(startLine, lines.length - 1);
  endLine = Math.min(endLine, lines.length - 1);

  const startText = String(lines[startLine] ?? "");
  const endText = String(lines[endLine] ?? "");
  startColumn = Math.min(startColumn, startText.length);
  endColumn = Math.min(endColumn, endText.length);

  const prefix = startText.slice(0, startColumn);
  const suffix = endText.slice(endColumn);

  const normalizeChangeText = options.normalizeNewlines !== false;
  const insertedText = normalizeChangeText ? normalizeNewlines(newText) : String(newText ?? "");
  const inserted = insertedText.split("\n");
  if (inserted.length === 0) {
    inserted.push("");
  }

  const replacement = [];
  if (inserted.length === 1) {
    replacement.push(`${prefix}${inserted[0] ?? ""}${suffix}`);
  } else {
    replacement.push(`${prefix}${inserted[0] ?? ""}`);
    for (let i = 1; i < inserted.length - 1; i += 1) {
      replacement.push(inserted[i] ?? "");
    }
    replacement.push(`${inserted[inserted.length - 1] ?? ""}${suffix}`);
  }

  lines.splice(startLine, endLine - startLine + 1, ...replacement);
}

function lineColumnToOffset(text:string, targetLine:IAnyValue, targetColumn:IAnyValue) {
  const source = String(text ?? "");
  const targetLineNo = Math.max(0, toInt(targetLine, 0));
  const targetColumnNo = Math.max(0, toInt(targetColumn, 0));

  let line = 0;
  let index = 0;
  while (index < source.length && line < targetLineNo) {
    const code = source.charCodeAt(index);
    if (code === 13) {
      index += 1;
      if (index < source.length && source.charCodeAt(index) === 10) {
        index += 1;
      }
      line += 1;
      continue;
    }
    if (code === 10) {
      index += 1;
      line += 1;
      continue;
    }
    index += 1;
  }

  let column = 0;
  while (index < source.length && column < targetColumnNo) {
    const code = source.charCodeAt(index);
    if (code === 10 || code === 13) {
      break;
    }
    index += 1;
    column += 1;
  }
  return index;
}

export function applyTextChangeToText(
  originalText: TextInput,
  range: IRange,
  newText: TextInput,
  options: { normalizeNewlines?: boolean } = {},
): string {
  const source = String(originalText ?? "");
  const normalizedRange = ensureRange(range);
  let startOffset = lineColumnToOffset(source, normalizedRange.start.line, normalizedRange.start.column);
  let endOffset = lineColumnToOffset(source, normalizedRange.end.line, normalizedRange.end.column);
  if (startOffset > endOffset) {
    const tmp = startOffset;
    startOffset = endOffset;
    endOffset = tmp;
  }

  const insertedText = options.normalizeNewlines === false
    ? String(newText ?? "")
    : normalizeNewlines(newText);
  return `${source.slice(0, startOffset)}${insertedText}${source.slice(endOffset)}`;
}

export function applyTextChangesToText(
  originalText: TextInput,
  changes: Iterable<ITextChange> | ITextChange[] | null | undefined,
  options: { normalizeNewlines?: boolean } = {},
): string {
  let output = String(originalText ?? "");
  asArray(changes).forEach((change: ITextChange) => {
      output = applyTextChangeToText(
        output,
        change?.range,
        change?.newText ?? (change as IAnyRecord | null | undefined)?.new_text ?? "",
        options,
      );
  });
  return output;
}

function isLineStructureChange(change:IEditorTextChange) {
  const range = ensureRange(change?.range);
  if (range.start.line !== range.end.line) {
    return true;
  }

  return hasLineBreak(change?.oldText ?? (change as IAnyRecord | null | undefined)?.old_text ?? "")
    || hasLineBreak(change?.newText ?? (change as IAnyRecord | null | undefined)?.new_text ?? "");
}

function normalizePosition(position:ITextPosition | null) {
  if (!position) {
    return { line: 0, column: 0 };
  }
  return {
    line: ensureLine(position.line),
    column: ensureColumn(position.column),
  };
}

function iterateLineEntries(input:IAnyValue, callback:(...args: IAnyValue[]) => IAnyValue) {
  if (!input) {
    return;
  }

  if (input instanceof Map) {
    input.forEach((items:IAnyValue[], line:number) => {
      callback(ensureLine(line), asArray(items));
    });
    return;
  }

  if (Array.isArray(input)) {
    input.forEach((entry:IAnyRecord, index:number) => {
      if (Array.isArray(entry) && entry.length >= 2) {
        callback(ensureLine(entry[0]), asArray(entry[1]));
        return;
      }
      if (entry && typeof entry === "object" && Number.isFinite(entry.line)) {
        const items = entry.items ?? entry.spans ?? entry.hints ?? entry.phantoms ?? entry.icons ?? entry.diagnostics;
        callback(ensureLine(entry.line), asArray(items));
        return;
      }
      callback(ensureLine(index), asArray(entry));
    });
    return;
  }

  if (typeof input === "object") {
    Object.keys(input).forEach((lineKey:IAnyValue) => {
      callback(ensureLine(lineKey), asArray(input[lineKey]));
    });
  }
}

function cloneLineMap(input:IAnyValue) {
  if (input == null) {
    return null;
  }
  const out = new Map();
  iterateLineEntries(input, (line:number, items:IAnyValue[]) => {
    out.set(line, items.map((item:IAnyValue) => ({ ...item })));
  });
  return out;
}

function cloneList(input:IAnyValue) {
  if (input == null) {
    return null;
  }
  return asArray(input).map((item:IAnyValue) => {
    if (item == null || typeof item !== "object") {
      return item;
    }
    if (Array.isArray(item)) {
      return item.slice();
    }
    return { ...item };
  });
}

function appendLineMap(target:IAnyValue, source:IAnyValue) {
  if (!source) {
    return;
  }
  source.forEach((items:IAnyValue[], line:number) => {
    if (!target.has(line)) {
      target.set(line, []);
    }
    const outItems = target.get(line);
    items.forEach((item:IAnyValue) => {
      outItems.push({ ...item });
    });
  });
}

function modePriority(mode:IAnyValue) {
  switch (mode) {
    case DecorationApplyMode.REPLACE_ALL:
      return 2;
    case DecorationApplyMode.REPLACE_RANGE:
      return 1;
    case DecorationApplyMode.MERGE:
    default:
      return 0;
  }
}

function mergeMode(current:IAnyValue, next:IAnyValue) {
  return modePriority(next) > modePriority(current) ? next : current;
}

function normalizeCompletionKind(kind:IAnyValue) {
  const n = toInt(kind, CompletionItem.KIND_TEXT);
  return n >= CompletionItem.KIND_KEYWORD && n <= CompletionItem.KIND_TEXT
    ? n
    : CompletionItem.KIND_TEXT;
}

function normalizeInsertTextFormat(format:IAnyValue) {
  const n = toInt(format, CompletionItem.INSERT_TEXT_FORMAT_PLAIN_TEXT);
  if (n === CompletionItem.INSERT_TEXT_FORMAT_SNIPPET) {
    return n;
  }
  return CompletionItem.INSERT_TEXT_FORMAT_PLAIN_TEXT;
}

function normalizeCompletionItem(input:IAnyValue) {
  if (input instanceof CompletionItem) {
    return input;
  }
  return new CompletionItem(input || {});
}

function normalizeCompletionItems(items:IAnyValue[]) {
  return asArray(items).map((item:IAnyValue) => normalizeCompletionItem(item));
}

function safeCall(fn:(...args: IAnyValue[]) => IAnyValue) {
  try {
    return fn();
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function loadSweetEditorCore(options: IWasmLoadOptions = {}): Promise<IAnyValue> {
  const { moduleFactory, modulePath, moduleOptions = {} } = options;

  let factory = moduleFactory;
  let moduleBaseUrl = null;
  if (!factory) {
    if (!modulePath) {
      throw new Error("modulePath or moduleFactory is required to load SweetEditor wasm module.");
    }
    moduleBaseUrl = new URL(modulePath, import.meta.url);
    const imported = await import(moduleBaseUrl.href);
    factory = imported.default || imported.createSweetEditorModule || imported;
  }

  if (typeof factory !== "function") {
    throw new Error("Invalid wasm module factory.");
  }

  const finalOptions = { ...moduleOptions };
  if (moduleBaseUrl && typeof finalOptions.locateFile !== "function") {
    finalOptions.locateFile = (path:string) => {
      const url = new URL(path, moduleBaseUrl);
      if (moduleBaseUrl.search && !url.search) {
        url.search = moduleBaseUrl.search;
      }
      return url.href;
    };
  }

  return factory(finalOptions);
}

export class Document {
  [key: string]: IAnyValue;
  protected _native: INativeDocument | null;
  kind: string;

  constructor(nativeDocument: INativeDocument | null, kind: string) {
    if (new.target === Document) {
      throw new TypeError("Document is abstract. Use DocumentFactory.");
    }
    this._native = nativeDocument;
    this.kind = kind;
  }

  getNative(): IAnyRecord | null {
    return this._native;
  }

  getText(): string {
    return this._native?.getU8Text() ?? "";
  }

  getLineCount(): number {
    return this._native?.getLineCount() ?? 0;
  }

  getLineText(line: number): string {
    return this._native?.getLineU16Text(line) ?? "";
  }

  getPositionFromCharIndex(charIndex: number): IPoint {
    return this._native?.getPositionFromCharIndex(charIndex) ?? { line: 0, column: 0 };
  }

  getCharIndexFromPosition(position: IPoint): number {
    return this._native?.getCharIndexFromPosition(position) ?? 0;
  }

  dispose() {
    if (this._native) {
      this._native.delete();
      this._native = null;
    }
  }
}

class PieceTableDocumentImpl extends Document {
  constructor(nativeDocument:INativeDocument) {
    super(nativeDocument, "piece-table");
  }
}

class LineArrayDocumentImpl extends Document {
  constructor(nativeDocument:INativeDocument) {
    super(nativeDocument, "line-array");
  }
}

export class DocumentFactory {
  [key: string]: IAnyValue;
  private readonly _wasm: IAnyRecord;

  constructor(wasmModule: IAnyRecord) {
    this._wasm = wasmModule;
  }

  fromText(text: TextInput, options: { kind?: "piece-table" | "line-array" } = {}): Document {
    const kind = options.kind || "piece-table";
    if (kind === "line-array") {
      return this.fromLineArray(text);
    }
    return this.fromPieceTable(text);
  }

  fromPieceTable(text: TextInput): Document {
    return new PieceTableDocumentImpl(new this._wasm.PieceTableDocument(text || "") as INativeDocument);
  }

  fromLineArray(text: TextInput): Document {
    return new LineArrayDocumentImpl(new this._wasm.LineArrayDocument(text || "") as INativeDocument);
  }
}
export class WebEditorCore {
  [key: string]: IAnyValue;

  constructor(
    wasmModule: IAnyRecord,
    textMeasurerCallbacks: IAnyRecord,
    editorOptions: IAnyRecord = {},
    onDidMutate: (() => void) | null = null,
  ) {
    this._wasm = wasmModule;
    this._onDidMutate = typeof onDidMutate === "function" ? onDidMutate : null;
    this._notifySuppressed = 0;
    this._notifyPending = false;

    const nativeOptions = {
      touch_slop: editorOptions.touchSlop ?? 10.0,
      double_tap_timeout: editorOptions.doubleTapTimeout ?? 300,
      long_press_ms: editorOptions.longPressMs ?? 500,
      max_undo_stack_size: editorOptions.maxUndoStackSize ?? 512,
    };

    this._native = new wasmModule.EditorCore(textMeasurerCallbacks, nativeOptions);
    this._spanLayer = resolveEnum(wasmModule, "SpanLayer", FALLBACK_SPAN_LAYER);
    this._inlayType = resolveEnum(wasmModule, "InlayType", FALLBACK_INLAY_TYPE);
    this._separatorStyle = resolveEnum(wasmModule, "SeparatorStyle", FALLBACK_SEPARATOR_STYLE);
    this._diagnosticSeverity = resolveEnum(wasmModule, "DiagnosticSeverity", FALLBACK_DIAGNOSTIC_SEVERITY);
  }

  getNative() {
    return this._native;
  }

  beginBatch() {
    this._notifySuppressed += 1;
  }

  endBatch() {
    if (this._notifySuppressed > 0) {
      this._notifySuppressed -= 1;
    }
    if (this._notifySuppressed === 0 && this._notifyPending) {
      this._notifyPending = false;
      this._emitMutate();
    }
  }

  withBatch(fn:(...args: IAnyValue[]) => IAnyValue) {
    this.beginBatch();
    try {
      return fn();
    } finally {
      this.endBatch();
    }
  }

  _invoke(method:string, ...args:IAnyValue[]) {
    const fn = this._native?.[method];
    if (typeof fn !== "function") {
      throw new Error(`EditorCore method not found: ${method}`);
    }
    return fn.apply(this._native, args);
  }

  _invokeOptional(method:string, ...args:IAnyValue[]) {
    const fn = this._native?.[method];
    if (typeof fn !== "function") {
      return undefined;
    }
    return fn.apply(this._native, args);
  }

  call(method:string, ...args:IAnyValue[]) {
    const result = this._invoke(method, ...args);
    this._notifyMutate();
    return result;
  }

  read(method:string, ...args:IAnyValue[]) {
    return this._invoke(method, ...args);
  }

  loadDocument(document:IAnyValue) {
    const nativeDoc = typeof document?.getNative === "function" ? document.getNative() : document;
    const result = this._native.loadDocument(nativeDoc);
    this._notifyMutate();
    return result;
  }

  setDocument(document:IAnyValue) {
    return this.loadDocument(document);
  }

  setViewport(width:number, height:number) {
    const result = this._native.setViewport({ width, height });
    this._notifyMutate();
    return result;
  }

  buildRenderModel() {
    return this.read("buildRenderModel");
  }

  handleGestureEvent(eventData:IEditorGestureEvent) {
    const eventRecord = eventData as IAnyRecord;
    const result = this._native.handleGestureEventRaw(
      eventData.type ?? 0,
      eventData.points,
      eventData.modifiers ?? 0,
      toFiniteNumber(eventData.wheelDeltaX ?? eventRecord.wheel_delta_x) ?? 0,
      toFiniteNumber(eventData.wheelDeltaY ?? eventRecord.wheel_delta_y) ?? 0,
      toFiniteNumber(eventData.directScale ?? eventRecord.direct_scale) ?? 1.0,
    );
    this._notifyMutate();
    return result;
  }

  handleGestureEventEx(eventData:IEditorGestureEvent) {
    const eventRecord = eventData as IAnyRecord;
    const result = this._invokeOptional(
      "handleGestureEventEx",
      eventData.type ?? 0,
      eventData.points,
      eventData.modifiers ?? 0,
      toFiniteNumber(eventData.wheelDeltaX ?? eventRecord.wheel_delta_x) ?? 0,
      toFiniteNumber(eventData.wheelDeltaY ?? eventRecord.wheel_delta_y) ?? 0,
      toFiniteNumber(eventData.directScale ?? eventRecord.direct_scale) ?? 1.0,
    );
    if (typeof result !== "undefined") {
      this._notifyMutate();
      return result;
    }
    return this.handleGestureEvent(eventData);
  }

  handleKeyEvent(eventData:IEditorKeyEvent) {
    const eventRecord = eventData as IAnyRecord;
    const result = this._native.handleKeyEventRaw(
      toInt(eventData.keyCode ?? eventRecord.key_code, 0),
      eventData.text ?? "",
      eventData.modifiers ?? 0,
    );
    this._notifyMutate();
    return result;
  }

  setKeyMap(keyMap:IAnyValue) {
    const normalizedBindings:IAnyValue[] = [];
    const pushBinding = (binding:IAnyValue) => {
      if (!binding || typeof binding !== "object") {
        return;
      }
      const first = binding.first || {};
      const second = binding.second || {};
      const firstChord = {
        modifiers: toInt(first.modifiers, 0),
        key_code: toInt(first.keyCode ?? first.key_code, 0),
      };
      if (!firstChord.key_code) {
        return;
      }
      const secondChord = {
        modifiers: toInt(second.modifiers, 0),
        key_code: toInt(second.keyCode ?? second.key_code, 0),
      };
      normalizedBindings.push({
        first: firstChord,
        second: secondChord,
        command: toInt(binding.command, 0),
      });
    };

    if (Array.isArray(keyMap)) {
      keyMap.forEach(pushBinding);
    } else if (keyMap && typeof keyMap === "object") {
      const record = keyMap as IAnyRecord;
      const bindings = record.bindings;
      if (Array.isArray(bindings)) {
        bindings.forEach(pushBinding);
      } else if (typeof bindings?.[Symbol.iterator] === "function") {
        for (const item of Array.from(bindings as Iterable<IAnyValue>)) {
          pushBinding(item);
        }
      }
    }

    const fn = this._native?.setKeyMap;
    if (typeof fn !== "function") {
      return undefined;
    }
    const result = fn.call(this._native, { bindings: normalizedBindings });
    this._notifyMutate();
    return result;
  }

  tickEdgeScroll() {
    const result = this._native.tickEdgeScroll();
    this._notifyMutate();
    return result;
  }

  tickFling() {
    const result = this._native.tickFling();
    this._notifyMutate();
    return result;
  }

  stopFling() {
    const fn = this._native?.stopFling;
    if (typeof fn !== "function") {
      return undefined;
    }
    const result = fn.call(this._native);
    this._notifyMutate();
    return result;
  }

  tickAnimations() {
    const result = this._invokeOptional("tickAnimations");
    if (typeof result !== "undefined") {
      this._notifyMutate();
    }
    return result;
  }

  onFontMetricsChanged() {
    const result = this._native.onFontMetricsChanged();
    this._notifyMutate();
    return result;
  }

  setFoldArrowMode(mode:IAnyValue) {
    const result = this._native.setFoldArrowMode(toInt(mode, 0));
    this._notifyMutate();
    return result;
  }

  setWrapMode(mode:IAnyValue) {
    const result = this._native.setWrapMode(toInt(mode, 0));
    this._notifyMutate();
    return result;
  }

  setTabSize(tabSize:number) {
    if (typeof this._native?.setTabSize === "function") {
      const result = this._native.setTabSize(Math.max(1, toInt(tabSize, 4)));
      this._notifyMutate();
      return result;
    }
  }

  setScale(scale:number) {
    const value = Number(scale);
    const result = this._native.setScale(Number.isFinite(value) ? value : 1.0);
    this._notifyMutate();
    return result;
  }

  setLineSpacing(add:number, mult:number) {
    const addValue = Number(add);
    const multValue = Number(mult);
    const result = this._native.setLineSpacing(
      Number.isFinite(addValue) ? addValue : 0.0,
      Number.isFinite(multValue) ? multValue : 1.0,
    );
    this._notifyMutate();
    return result;
  }

  setContentStartPadding(padding:number) {
    const value = Number(padding);
    const result = this._native.setContentStartPadding(Number.isFinite(value) ? value : 0.0);
    this._notifyMutate();
    return result;
  }

  setShowSplitLine(show:boolean) {
    const result = this._native.setShowSplitLine(Boolean(show));
    this._notifyMutate();
    return result;
  }

  setCurrentLineRenderMode(mode:IAnyValue) {
    const result = this._native.setCurrentLineRenderMode(toInt(mode, 0));
    this._notifyMutate();
    return result;
  }

  setGutterSticky(sticky:boolean) {
    const fn = this._native?.setGutterSticky;
    if (typeof fn !== "function") {
      return undefined;
    }
    const result = fn.call(this._native, Boolean(sticky));
    this._notifyMutate();
    return result;
  }

  setGutterVisible(visible:boolean) {
    const fn = this._native?.setGutterVisible;
    if (typeof fn !== "function") {
      return undefined;
    }
    const result = fn.call(this._native, Boolean(visible));
    this._notifyMutate();
    return result;
  }

  getViewState() {
    return this.read("getViewState");
  }

  getScrollMetrics() {
    return this.read("getScrollMetrics");
  }

  getLayoutMetrics() {
    return this.read("getLayoutMetrics");
  }

  insert(text:string) {
    const result = this._native.insertText(String(text ?? ""));
    this._notifyMutate();
    return result;
  }

  insertText(text:string) {
    return this.insert(text);
  }

  replaceText(range:ITextRange, newText:string) {
    const result = this._native.replaceText(ensureEditRange(range), String(newText ?? ""));
    this._notifyMutate();
    return result;
  }

  deleteText(range:ITextRange) {
    const result = this._native.deleteText(ensureEditRange(range));
    this._notifyMutate();
    return result;
  }

  backspace() {
    const result = this._native.backspace();
    this._notifyMutate();
    return result;
  }

  deleteForward() {
    const result = this._native.deleteForward();
    this._notifyMutate();
    return result;
  }

  moveLineUp() {
    const result = this._native.moveLineUp();
    this._notifyMutate();
    return result;
  }

  moveLineDown() {
    const result = this._native.moveLineDown();
    this._notifyMutate();
    return result;
  }

  copyLineUp() {
    const result = this._native.copyLineUp();
    this._notifyMutate();
    return result;
  }

  copyLineDown() {
    const result = this._native.copyLineDown();
    this._notifyMutate();
    return result;
  }

  deleteLine() {
    const result = this._native.deleteLine();
    this._notifyMutate();
    return result;
  }

  insertLineAbove() {
    const result = this._native.insertLineAbove();
    this._notifyMutate();
    return result;
  }

  insertLineBelow() {
    const result = this._native.insertLineBelow();
    this._notifyMutate();
    return result;
  }

  undo() {
    const result = this._native.undo();
    this._notifyMutate();
    return result;
  }

  redo() {
    const result = this._native.redo();
    this._notifyMutate();
    return result;
  }

  setCursorPosition(position:ITextPosition) {
    const result = this._native.setCursorPosition(normalizePosition(position));
    this._notifyMutate();
    return result;
  }

  setSelection(startOrRange:ITextRange | ITextPosition, startColumn:number, endLine:number, endColumn:number) {
    let result;
    const asRange = startOrRange as ITextRange;
    if (asRange && typeof asRange === "object" && asRange.start && asRange.end) {
      result = this._native.setSelection(ensureRange(asRange));
    } else {
      const position = startOrRange as ITextPosition;
      const range = ensureRange({
        start: {
          line: ensureLine(position?.line),
          column: ensureColumn(startColumn),
        },
        end: {
          line: ensureLine(endLine),
          column: ensureColumn(endColumn),
        },
      });
      result = this._native.setSelection(range);
    }
    this._notifyMutate();
    return result;
  }

  clearSelection() {
    const result = this._native.clearSelection();
    this._notifyMutate();
    return result;
  }

  selectAll() {
    const result = this._native.selectAll();
    this._notifyMutate();
    return result;
  }

  getSelectedText() {
    return this.read("getSelectedText");
  }

  moveCursorLeft(extendSelection:boolean = false) {
    const result = this._native.moveCursorLeft(Boolean(extendSelection));
    this._notifyMutate();
    return result;
  }

  moveCursorRight(extendSelection:boolean = false) {
    const result = this._native.moveCursorRight(Boolean(extendSelection));
    this._notifyMutate();
    return result;
  }

  moveCursorUp(extendSelection:boolean = false) {
    const result = this._native.moveCursorUp(Boolean(extendSelection));
    this._notifyMutate();
    return result;
  }

  moveCursorDown(extendSelection:boolean = false) {
    const result = this._native.moveCursorDown(Boolean(extendSelection));
    this._notifyMutate();
    return result;
  }

  moveCursorToLineStart(extendSelection:boolean = false) {
    const result = this._native.moveCursorToLineStart(Boolean(extendSelection));
    this._notifyMutate();
    return result;
  }

  moveCursorToLineEnd(extendSelection:boolean = false) {
    const result = this._native.moveCursorToLineEnd(Boolean(extendSelection));
    this._notifyMutate();
    return result;
  }

  moveCursorPageUp(extendSelection:boolean = false) {
    const fn = this._native?.moveCursorPageUp;
    if (typeof fn !== "function") {
      return undefined;
    }
    const result = fn.call(this._native, Boolean(extendSelection));
    this._notifyMutate();
    return result;
  }

  moveCursorPageDown(extendSelection:boolean = false) {
    const fn = this._native?.moveCursorPageDown;
    if (typeof fn !== "function") {
      return undefined;
    }
    const result = fn.call(this._native, Boolean(extendSelection));
    this._notifyMutate();
    return result;
  }

  compositionStart() {
    const result = this._native.compositionStart();
    this._notifyMutate();
    return result;
  }

  compositionUpdate(text:string) {
    const result = this._native.compositionUpdate(String(text ?? ""));
    this._notifyMutate();
    return result;
  }

  compositionEnd(committedText:IAnyValue) {
    const result = this._native.compositionEnd(String(committedText ?? ""));
    this._notifyMutate();
    return result;
  }

  compositionCancel() {
    const result = this._native.compositionCancel();
    this._notifyMutate();
    return result;
  }

  isComposing() {
    return this.read("isComposing");
  }

  setCompositionEnabled(enabled:boolean) {
    const result = this._native.setCompositionEnabled(Boolean(enabled));
    this._notifyMutate();
    return result;
  }

  isCompositionEnabled() {
    return this.read("isCompositionEnabled");
  }

  setReadOnly(readOnly:boolean) {
    const result = this._native.setReadOnly(Boolean(readOnly));
    this._notifyMutate();
    return result;
  }

  isReadOnly() {
    return this.read("isReadOnly");
  }

  setAutoIndentMode(mode:IAnyValue) {
    const result = this._native.setAutoIndentMode(toInt(mode, 0));
    this._notifyMutate();
    return result;
  }

  getAutoIndentMode() {
    return this.read("getAutoIndentMode");
  }

  setBackspaceUnindent(enabled:boolean) {
    const fn = this._native?.setBackspaceUnindent;
    if (typeof fn !== "function") {
      return undefined;
    }
    const result = fn.call(this._native, Boolean(enabled));
    this._notifyMutate();
    return result;
  }

  setInsertSpaces(enabled:boolean) {
    const fn = this._native?.setInsertSpaces;
    if (typeof fn !== "function") {
      return undefined;
    }
    const result = fn.call(this._native, Boolean(enabled));
    this._notifyMutate();
    return result;
  }

  setHandleConfig(config:IAnyRecord) {
    const result = this._native.setHandleConfig(config || {});
    this._notifyMutate();
    return result;
  }

  getHandleConfig() {
    if (typeof this._native?.getHandleConfig === "function") {
      return this.read("getHandleConfig");
    }
    return null;
  }

  setScrollbarConfig(config:IAnyRecord) {
    const result = this._native.setScrollbarConfig(config || {});
    this._notifyMutate();
    return result;
  }

  getScrollbarConfig() {
    if (typeof this._native?.getScrollbarConfig === "function") {
      return this.read("getScrollbarConfig");
    }
    return null;
  }

  getPositionRect(line:number, column:number) {
    if (typeof this._native?.getPositionScreenRect === "function") {
      return this.read("getPositionScreenRect", ensureLine(line), ensureColumn(column));
    }
    return this.read("getPositionRect", ensureLine(line), ensureColumn(column));
  }

  getCursorRect() {
    if (typeof this._native?.getCursorScreenRect === "function") {
      return this.read("getCursorScreenRect");
    }
    return this.read("getCursorRect");
  }

  scrollToLine(line:number, behavior:number = 0) {
    const result = this._native.scrollToLine(ensureLine(line), toInt(behavior, 0));
    this._notifyMutate();
    return result;
  }

  gotoPosition(line:number, column:number) {
    const result = this._native.gotoPosition(ensureLine(line), ensureColumn(column));
    this._notifyMutate();
    return result;
  }

  setScroll(scrollX:number, scrollY:number) {
    const x = Number(scrollX);
    const y = Number(scrollY);
    const result = this._native.setScroll(
      Number.isFinite(x) ? x : 0.0,
      Number.isFinite(y) ? y : 0.0,
    );
    this._notifyMutate();
    return result;
  }

  ensureCursorVisible() {
    const fn = this._native?.ensureCursorVisible;
    if (typeof fn !== "function") {
      return undefined;
    }
    const result = fn.call(this._native);
    this._notifyMutate();
    return result;
  }

  insertSnippet(snippetTemplate:string) {
    const result = this._native.insertSnippet(String(snippetTemplate ?? ""));
    this._notifyMutate();
    return result;
  }

  startLinkedEditing(model:IAnyValue) {
    const result = this._native.startLinkedEditing(model || {});
    this._notifyMutate();
    return result;
  }

  linkedEditingNext() {
    if (typeof this._native?.linkedEditingNextTabStop === "function") {
      const result = this._native.linkedEditingNextTabStop();
      this._notifyMutate();
      return result;
    }
    const result = this._native.linkedEditingNext();
    this._notifyMutate();
    return result;
  }

  linkedEditingPrev() {
    if (typeof this._native?.linkedEditingPrevTabStop === "function") {
      const result = this._native.linkedEditingPrevTabStop();
      this._notifyMutate();
      return result;
    }
    const result = this._native.linkedEditingPrev();
    this._notifyMutate();
    return result;
  }

  cancelLinkedEditing() {
    const result = this._native.cancelLinkedEditing();
    this._notifyMutate();
    return result;
  }

  finishLinkedEditing() {
    const result = this._native.finishLinkedEditing();
    this._notifyMutate();
    return result;
  }

  toggleFoldAt(line:number) {
    const result = this._native.toggleFoldAt(ensureLine(line));
    this._notifyMutate();
    return result;
  }

  toggleFold(line:number) {
    return this.toggleFoldAt(line);
  }

  foldAt(line:number) {
    const result = this._native.foldAt(ensureLine(line));
    this._notifyMutate();
    return result;
  }

  unfoldAt(line:number) {
    const result = this._native.unfoldAt(ensureLine(line));
    this._notifyMutate();
    return result;
  }

  foldAll() {
    const result = this._native.foldAll();
    this._notifyMutate();
    return result;
  }

  unfoldAll() {
    const result = this._native.unfoldAll();
    this._notifyMutate();
    return result;
  }

  isLineVisible(line:number) {
    return this.read("isLineVisible", ensureLine(line));
  }

  setMatchedBrackets(open:IAnyValue, close:IAnyValue) {
    let result;
    if (arguments.length >= 4) {
      const openPosition = { line: ensureLine(arguments[0]), column: ensureColumn(arguments[1]) };
      const closePosition = { line: ensureLine(arguments[2]), column: ensureColumn(arguments[3]) };
      result = this._native.setMatchedBrackets(openPosition, closePosition);
    } else {
      result = this._native.setMatchedBrackets(normalizePosition(open), normalizePosition(close));
    }
    this._notifyMutate();
    return result;
  }

  clearMatchedBrackets() {
    const result = this._native.clearMatchedBrackets();
    this._notifyMutate();
    return result;
  }

  getCursorPosition() {
    return this.read("getCursorPosition");
  }

  getWordRangeAtCursor() {
    return this.read("getWordRangeAtCursor");
  }

  getWordAtCursor() {
    return this.read("getWordAtCursor");
  }

  getSelection() {
    return this.read("getSelection");
  }

  hasSelection() {
    return this.read("hasSelection");
  }

  canUndo() {
    return this.read("canUndo");
  }

  canRedo() {
    return this.read("canRedo");
  }

  isInLinkedEditing() {
    return this.read("isInLinkedEditing");
  }

  registerTextStyle(styleId:number, color:number, backgroundColor:number = 0, fontStyle:number = 0) {
    const style = {
      color: toInt(color, 0),
      background_color: toInt(backgroundColor, 0),
      font_style: toInt(fontStyle, 0),
    };
    const result = this._native.registerTextStyle(toInt(styleId, 0), style);
    this._notifyMutate();
    return result;
  }

  registerBatchTextStyles(data:IAnyValue) {
    const entries:Array<{ styleId: number; style: IAnyRecord }> = [];
    if (data instanceof Map) {
      data.forEach((style:IAnyValue, key:IAnyValue) => {
        entries.push({ styleId: toInt(key, 0), style: (style && typeof style === "object") ? style : {} });
      });
    } else if (Array.isArray(data)) {
      data.forEach((entry:IAnyValue) => {
        if (!entry || typeof entry !== "object") {
          return;
        }
        const styleId = toInt(entry.styleId ?? entry.style_id ?? entry.id, 0);
        const style = (entry.style && typeof entry.style === "object") ? entry.style : entry;
        entries.push({ styleId, style });
      });
    } else if (data && typeof data === "object") {
      Object.keys(data).forEach((key:string) => {
        const style = data[key];
        entries.push({
          styleId: toInt(key, 0),
          style: (style && typeof style === "object") ? style : {},
        });
      });
    }

    if (entries.length === 0) {
      return;
    }

    if (
      typeof this._native?.registerBatchTextStyles === "function"
      && typeof this._wasm?.TextStyleEntryVector === "function"
    ) {
      this._callWithVector("TextStyleEntryVector", entries, (entry:IAnyValue) => ({
        style_id: toInt(entry.styleId, 0),
        style: {
          color: toInt(entry.style?.color, 0),
          background_color: toInt(entry.style?.backgroundColor ?? entry.style?.background_color, 0),
          font_style: toInt(entry.style?.fontStyle ?? entry.style?.font_style, 0),
        },
      }), (vec:IAnyValue) => {
        const result = this._native.registerBatchTextStyles(vec);
        this._notifyMutate();
        return result;
      });
      return;
    }

    this.withBatch(() => {
      entries.forEach((entry) => {
        this.registerTextStyle(
          entry.styleId,
          toInt(entry.style.color, 0),
          toInt(entry.style.backgroundColor ?? entry.style.background_color, 0),
          toInt(entry.style.fontStyle ?? entry.style.font_style, 0),
        );
      });
    });
  }

  setLineSpans(line:number, layer:IAnyValue, spans:IAnyValue[]) {
    const lineNo = ensureLine(line);
    const layerValue = toInt(layer, this._spanLayer.SYNTAX);
    const src = asArray(spans);
    this._callWithVector("StyleSpanVector", src, (span:IAnyValue) => ({
      column: ensureColumn(span.column),
      length: ensureLength(span.length),
      style_id: toInt(span.styleId ?? span.style_id, 0),
    }), (vec:IAnyValue) => {
      const result = this._native.setLineSpans(lineNo, layerValue, vec);
      this._notifyMutate();
      return result;
    });
  }

  setBatchLineSpans(layer:IAnyValue, spansByLine:IAnyValue) {
    const layerValue = toInt(layer, this._spanLayer.SYNTAX);
    const batched = this._callBatchLineEntries(
      "LineStyleSpansEntryVector",
      "StyleSpanVector",
      "spans",
      spansByLine,
      (span:IAnyValue) => ({
        column: ensureColumn(span.column),
        length: ensureLength(span.length),
        style_id: toInt(span.styleId ?? span.style_id, 0),
      }),
      (entryVec:IAnyValue) => {
        const result = this._native.setBatchLineSpans(layerValue, entryVec);
        return result;
      },
    );
    if (batched) {
      this._notifyMutate();
      return;
    }
    this.withBatch(() => {
      iterateLineEntries(spansByLine, (line:number, spans:IAnyValue[]) => {
        this.setLineSpans(line, layerValue, spans);
      });
    });
  }

  clearLineSpans(line:number, layer:IAnyValue) {
    const result = this._invokeOptional("clearLineSpans", ensureLine(line), toInt(layer, this._spanLayer.SYNTAX));
    if (typeof result !== "undefined") {
      this._notifyMutate();
      return result;
    }
    return this.setLineSpans(line, layer, []);
  }

  setLineInlayHints(line:number, hints:IAnyValue[]) {
    const lineNo = ensureLine(line);
    const src = asArray(hints);
    this._callWithVector("InlayHintVector", src, (hint:IAnyValue) => this._toNativeInlayHint(hint), (vec:IAnyValue) => {
      const result = this._native.setLineInlayHints(lineNo, vec);
      this._notifyMutate();
      return result;
    });
  }

  setBatchLineInlayHints(hintsByLine:IAnyValue) {
    const batched = this._callBatchLineEntries(
      "LineInlayHintsEntryVector",
      "InlayHintVector",
      "hints",
      hintsByLine,
      (hint:IAnyValue) => this._toNativeInlayHint(hint),
      (entryVec:IAnyValue) => {
        const result = this._native.setBatchLineInlayHints(entryVec);
        return result;
      },
    );
    if (batched) {
      this._notifyMutate();
      return;
    }
    this.withBatch(() => {
      iterateLineEntries(hintsByLine, (line:number, hints:IAnyValue[]) => {
        this.setLineInlayHints(line, hints);
      });
    });
  }

  setLinePhantomTexts(line:number, phantoms:IAnyValue) {
    const lineNo = ensureLine(line);
    const src = asArray(phantoms);
    this._callWithVector("PhantomTextVector", src, (phantom:IAnyValue) => ({
      column: ensureColumn(phantom.column),
      text: String(phantom.text ?? ""),
    }), (vec:IAnyValue) => {
      const result = this._native.setLinePhantomTexts(lineNo, vec);
      this._notifyMutate();
      return result;
    });
  }

  setBatchLinePhantomTexts(phantomsByLine:IAnyValue) {
    const batched = this._callBatchLineEntries(
      "LinePhantomTextsEntryVector",
      "PhantomTextVector",
      "phantoms",
      phantomsByLine,
      (phantom:IAnyValue) => ({
        column: ensureColumn(phantom.column),
        text: String(phantom.text ?? ""),
      }),
      (entryVec:IAnyValue) => {
        const result = this._native.setBatchLinePhantomTexts(entryVec);
        return result;
      },
    );
    if (batched) {
      this._notifyMutate();
      return;
    }
    this.withBatch(() => {
      iterateLineEntries(phantomsByLine, (line:number, phantoms:IAnyValue) => {
        this.setLinePhantomTexts(line, phantoms);
      });
    });
  }

  setLineGutterIcons(line:number, icons:IAnyValue[]) {
    const lineNo = ensureLine(line);
    const src = asArray(icons);
    this._callWithVector("GutterIconVector", src, (icon:IAnyValue) => ({
      icon_id: toInt(icon.iconId ?? icon.icon_id ?? icon, 0),
    }), (vec:IAnyValue) => {
      const result = this._native.setLineGutterIcons(lineNo, vec);
      this._notifyMutate();
      return result;
    });
  }

  setBatchLineGutterIcons(iconsByLine:IAnyValue) {
    const batched = this._callBatchLineEntries(
      "LineGutterIconsEntryVector",
      "GutterIconVector",
      "icons",
      iconsByLine,
      (icon:IAnyValue) => ({
        icon_id: toInt(icon.iconId ?? icon.icon_id ?? icon, 0),
      }),
      (entryVec:IAnyValue) => {
        const result = this._native.setBatchLineGutterIcons(entryVec);
        return result;
      },
    );
    if (batched) {
      this._notifyMutate();
      return;
    }
    this.withBatch(() => {
      iterateLineEntries(iconsByLine, (line:number, icons:IAnyValue[]) => {
        this.setLineGutterIcons(line, icons);
      });
    });
  }

  setLineCodeLens(line:number, items:IAnyValue[]) {
    if (typeof this._native?.setLineCodeLens !== "function") {
      return;
    }
    const lineNo = ensureLine(line);
    this._callWithVector("CodeLensItemVector", asArray(items), (item:IAnyValue) => ({
      text: String(item?.text ?? ""),
      command_id: toInt(item?.commandId ?? item?.command_id ?? item?.command ?? item?.id, 0),
    }), (vec:IAnyValue) => {
      const result = this._native.setLineCodeLens(lineNo, vec);
      this._notifyMutate();
      return result;
    });
  }

  setBatchLineCodeLens(itemsByLine:IAnyValue) {
    if (typeof this._native?.setBatchLineCodeLens !== "function") {
      this.withBatch(() => {
        iterateLineEntries(itemsByLine, (line:number, items:IAnyValue[]) => {
          this.setLineCodeLens(line, items);
        });
      });
      return;
    }
    const batched = this._callBatchLineEntries(
      "LineCodeLensEntryVector",
      "CodeLensItemVector",
      "items",
      itemsByLine,
      (item:IAnyValue) => ({
        text: String(item?.text ?? ""),
        command_id: toInt(item?.commandId ?? item?.command_id ?? item?.command ?? item?.id, 0),
      }),
      (entryVec:IAnyValue) => {
        const result = this._native.setBatchLineCodeLens(entryVec);
        return result;
      },
    );
    if (batched) {
      this._notifyMutate();
      return;
    }
    this.withBatch(() => {
      iterateLineEntries(itemsByLine, (line:number, items:IAnyValue[]) => {
        this.setLineCodeLens(line, items);
      });
    });
  }

  clearCodeLens() {
    const fn = this._native?.clearCodeLens;
    if (typeof fn !== "function") {
      return undefined;
    }
    const result = fn.call(this._native);
    this._notifyMutate();
    return result;
  }

  setLineDiagnostics(line:number, diagnostics:IAnyValue[]) {
    const lineNo = ensureLine(line);
    const src = asArray(diagnostics);
    this._callWithVector("DiagnosticSpanVector", src, (item:IAnyValue) => ({
      column: ensureColumn(item.column),
      length: ensureLength(item.length),
      severity: this._toNativeEnumValue("DiagnosticSeverity", item.severity, this._diagnosticSeverity.DIAG_HINT),
      color: toInt(item.color, 0),
    }), (vec:IAnyValue) => {
      const result = this._native.setLineDiagnostics(lineNo, vec);
      this._notifyMutate();
      return result;
    });
  }

  setBatchLineDiagnostics(diagsByLine:IAnyValue) {
    const batched = this._callBatchLineEntries(
      "LineDiagnosticsEntryVector",
      "DiagnosticSpanVector",
      "diagnostics",
      diagsByLine,
      (item:IAnyValue) => ({
        column: ensureColumn(item.column),
        length: ensureLength(item.length),
        severity: this._toNativeEnumValue("DiagnosticSeverity", item.severity, this._diagnosticSeverity.DIAG_HINT),
        color: toInt(item.color, 0),
      }),
      (entryVec:IAnyValue) => {
        const result = this._native.setBatchLineDiagnostics(entryVec);
        return result;
      },
    );
    if (batched) {
      this._notifyMutate();
      return;
    }
    this.withBatch(() => {
      iterateLineEntries(diagsByLine, (line:number, diagnostics:IAnyValue[]) => {
        this.setLineDiagnostics(line, diagnostics);
      });
    });
  }

  setIndentGuides(guides:IAnyValue[]) {
    this._callWithVector("IndentGuideVector", asArray(guides), (item:IAnyValue) => ({
      start: normalizePosition(item.start),
      end: normalizePosition(item.end),
    }), (vec:IAnyValue) => {
      const result = this._native.setIndentGuides(vec);
      this._notifyMutate();
      return result;
    });
  }

  setBracketGuides(guides:IAnyValue[]) {
    this._callWithVector("BracketGuideVector", asArray(guides), (item:IAnyValue) => ({
      parent: normalizePosition(item.parent),
      end: normalizePosition(item.end),
      children: asArray(item.children).map((child:IAnyValue) => normalizePosition(child)),
    }), (vec:IAnyValue) => {
      const result = this._native.setBracketGuides(vec);
      this._notifyMutate();
      return result;
    });
  }

  setFlowGuides(guides:IAnyValue[]) {
    this._callWithVector("FlowGuideVector", asArray(guides), (item:IAnyValue) => ({
      start: normalizePosition(item.start),
      end: normalizePosition(item.end),
    }), (vec:IAnyValue) => {
      const result = this._native.setFlowGuides(vec);
      this._notifyMutate();
      return result;
    });
  }

  setSeparatorGuides(guides:IAnyValue[]) {
    this._callWithVector("SeparatorGuideVector", asArray(guides), (item:IAnyValue) => ({
      line: ensureLine(item.line),
      style: this._toNativeEnumValue("SeparatorStyle", item.style, this._separatorStyle.SINGLE),
      count: Math.max(0, toInt(item.count, 0)),
      text_end_column: Math.max(0, toInt(item.textEndColumn ?? item.text_end_column, 0)),
    }), (vec:IAnyValue) => {
      const result = this._native.setSeparatorGuides(vec);
      this._notifyMutate();
      return result;
    });
  }

  setFoldRegions(regions:IAnyValue[]) {
    this._callWithVector("FoldRegionVector", asArray(regions), (item:IAnyValue) => ({
      start_line: ensureLine(item.startLine ?? item.start_line),
      end_line: ensureLine(item.endLine ?? item.end_line),
      collapsed: Boolean(item.collapsed),
    }), (vec:IAnyValue) => {
      const result = this._native.setFoldRegions(vec);
      this._notifyMutate();
      return result;
    });
  }

  setMaxGutterIcons(count:number) {
    const result = this._native.setMaxGutterIcons(Math.max(0, toInt(count, 0)));
    this._notifyMutate();
    return result;
  }

  clearHighlights(layer:IAnyValue = null) {
    let result;
    if (layer == null) {
      result = this._native.clearHighlights();
    } else {
      result = this._native.clearHighlights(toInt(layer, this._spanLayer.SYNTAX));
    }
    this._notifyMutate();
    return result;
  }

  clearHighlightsLayer(layer:IAnyValue) {
    return this.clearHighlights(layer);
  }

  clearInlayHints() {
    const result = this._native.clearInlayHints();
    this._notifyMutate();
    return result;
  }

  clearPhantomTexts() {
    const result = this._native.clearPhantomTexts();
    this._notifyMutate();
    return result;
  }

  clearGutterIcons() {
    const result = this._native.clearGutterIcons();
    this._notifyMutate();
    return result;
  }

  clearDiagnostics() {
    const result = this._native.clearDiagnostics();
    this._notifyMutate();
    return result;
  }

  clearGuides() {
    const result = this._native.clearGuides();
    this._notifyMutate();
    return result;
  }

  clearAllDecorations() {
    const result = this._native.clearAllDecorations();
    this._notifyMutate();
    return result;
  }

  setBracketPairs(bracketPairs:IAnyValue) {
    this._callWithVector("BracketPairVector", asArray(bracketPairs), (pair:IAnyValue) => ({
      open: toInt(pair.open, 0),
      close: toInt(pair.close, 0),
      auto_close: Boolean(pair.autoClose ?? pair.auto_close),
      surround: Boolean(pair.surround),
    }), (vec:IAnyValue) => {
      const result = this._native.setBracketPairs(vec);
      this._notifyMutate();
      return result;
    });
  }

  setAutoClosingPairs(bracketPairs:IAnyValue) {
    this._callWithVector("BracketPairVector", asArray(bracketPairs), (pair:IAnyValue) => ({
      open: toInt(pair.open, 0),
      close: toInt(pair.close, 0),
    }), (vec:IAnyValue) => {
      const fn = this._native?.setAutoClosingPairs;
      if (typeof fn !== "function") {
        return undefined;
      }
      const result = fn.call(this._native, vec);
      this._notifyMutate();
      return result;
    });
  }

  _toNativeInlayHint(hint:IAnyValue) {
    const typeValue = toInt(hint.type, this._inlayType.TEXT);
    const nativeType = this._toNativeEnumValue("InlayType", typeValue, this._inlayType.TEXT);
    if (typeValue === this._inlayType.ICON) {
      return {
        type: nativeType,
        column: ensureColumn(hint.column),
        text: "",
        icon_id: toInt(hint.iconId ?? hint.icon_id ?? hint.intValue, 0),
        color: 0,
      };
    }
    if (typeValue === this._inlayType.COLOR) {
      return {
        type: nativeType,
        column: ensureColumn(hint.column),
        text: "",
        icon_id: 0,
        color: toInt(hint.color ?? hint.colorValue ?? hint.intValue, 0),
      };
    }
    return {
      type: this._toNativeEnumValue("InlayType", this._inlayType.TEXT, this._inlayType.TEXT),
      column: ensureColumn(hint.column),
      text: String(hint.text ?? ""),
      icon_id: 0,
      color: 0,
    };
  }

  _toNativeEnumValue(enumName:string, value:IAnyValue, fallback:IAnyValue = 0) {
    const numericValue = toInt(value, fallback);
    const enumType = this._wasm?.[enumName];
    const enumValues = enumType?.values;
    if (enumValues && Object.prototype.hasOwnProperty.call(enumValues, String(numericValue))) {
      return enumValues[String(numericValue)];
    }
    return numericValue;
  }

  _callBatchLineEntries(entryVectorName:IAnyValue, itemVectorName:IAnyValue, entryFieldName:IAnyValue, entriesByLine:IAnyValue, itemMapper:(...args: IAnyValue[]) => IAnyValue, fn:(...args: IAnyValue[]) => IAnyValue) {
    const normalizedEntries:Array<{ line: number; items: IAnyValue[] }> = [];
    iterateLineEntries(entriesByLine, (line:number, items:IAnyValue[]) => {
      normalizedEntries.push({
        line: ensureLine(line),
        items: asArray(items),
      });
    });
    if (normalizedEntries.length === 0) {
      return true;
    }

    const EntryVectorCtor = this._wasm?.[entryVectorName];
    const ItemVectorCtor = this._wasm?.[itemVectorName];
    if (typeof EntryVectorCtor !== "function" || typeof ItemVectorCtor !== "function") {
      return false;
    }

    const entryVec = new EntryVectorCtor();
    try {
      normalizedEntries.forEach((entry:IAnyRecord) => {
        const itemVec = new ItemVectorCtor();
        try {
          entry.items.forEach((item:IAnyValue) => {
            itemVec.push_back(itemMapper(item));
          });
          entryVec.push_back({
            line: entry.line,
            [entryFieldName]: itemVec,
          });
        } finally {
          if (typeof itemVec.delete === "function") {
            itemVec.delete();
          }
        }
      });
      fn(entryVec);
      return true;
    } finally {
      if (typeof entryVec.delete === "function") {
        entryVec.delete();
      }
    }
  }

  _callWithVector(vectorName:IAnyValue, items:IAnyValue[], mapper:(...args: IAnyValue[]) => IAnyValue, fn:(...args: IAnyValue[]) => IAnyValue) {
    const Ctor = this._wasm?.[vectorName];
    if (typeof Ctor !== "function") {
      throw new Error(`Vector constructor not found: ${vectorName}`);
    }
    const vec = new Ctor();
    try {
      asArray(items).forEach((item:IAnyValue) => {
        vec.push_back(mapper(item));
      });
      fn(vec);
    } finally {
      if (typeof vec.delete === "function") {
        vec.delete();
      }
    }
  }

  dispose() {
    if (this._native) {
      this._native.delete();
      this._native = null;
    }
  }

  _notifyMutate() {
    if (this._notifySuppressed > 0) {
      this._notifyPending = true;
      return;
    }
    this._emitMutate();
  }

  _emitMutate() {
    if (this._onDidMutate) {
      this._onDidMutate();
    }
  }
}
export const CompletionTriggerKind = Object.freeze({
  INVOKED: 0,
  CHARACTER: 1,
  RETRIGGER: 2,
});

export class CompletionItem {
  [key: string]: IAnyValue;

  static KIND_KEYWORD = 0;
  static KIND_FUNCTION = 1;
  static KIND_VARIABLE = 2;
  static KIND_CLASS = 3;
  static KIND_INTERFACE = 4;
  static KIND_MODULE = 5;
  static KIND_PROPERTY = 6;
  static KIND_SNIPPET = 7;
  static KIND_TEXT = 8;

  static INSERT_TEXT_FORMAT_PLAIN_TEXT = 1;
  static INSERT_TEXT_FORMAT_SNIPPET = 2;

  constructor(init: ICompletionItemInit = {}) {
    this.label = String(init.label ?? "");
    this.detail = init.detail == null ? null : String(init.detail);
    this.insertText = init.insertText == null ? null : String(init.insertText);
    this.insertTextFormat = normalizeInsertTextFormat(init.insertTextFormat);
    this.textEdit = init.textEdit
      ? {
          range: ensureRange(init.textEdit.range),
          newText: String(init.textEdit.newText ?? ""),
        }
      : null;
    this.filterText = init.filterText == null ? null : String(init.filterText);
    this.sortKey = init.sortKey == null ? null : String(init.sortKey);
    this.kind = normalizeCompletionKind(init.kind);
  }

  get matchText() {
    return this.filterText || this.label;
  }
}

export class CompletionContext {
  [key: string]: IAnyValue;

  constructor({
    triggerKind = CompletionTriggerKind.INVOKED,
    triggerCharacter = null,
    cursorPosition = { line: 0, column: 0 },
    lineText = "",
    wordRange = null,
    languageConfiguration = null,
    editorMetadata = null,
  }: {
    triggerKind?: number;
    triggerCharacter?: string | null;
    cursorPosition?: IPoint;
    lineText?: string;
    wordRange?: IRange | null;
    languageConfiguration?: IAnyRecord | null;
    editorMetadata?: IAnyRecord | null;
  } = {}) {
    this.triggerKind = toInt(triggerKind, CompletionTriggerKind.INVOKED);
    this.triggerCharacter = triggerCharacter == null ? null : String(triggerCharacter);
    this.cursorPosition = normalizePosition(cursorPosition);
    this.lineText = String(lineText ?? "");
    this.wordRange = ensureRange(wordRange ?? null, this.cursorPosition);
    this.languageConfiguration = languageConfiguration;
    this.editorMetadata = editorMetadata;
  }
}

export class CompletionResult {
  [key: string]: IAnyValue;

  constructor(items: ICompletionItemInit[] = [], isIncomplete:boolean = false) {
    this.items = normalizeCompletionItems(items);
    this.isIncomplete = Boolean(isIncomplete);
  }

  static EMPTY = new CompletionResult([], false);
}

export class CompletionReceiver {
  [key: string]: IAnyValue;

  accept(_result:IAnyValue) {
    throw new Error("CompletionReceiver.accept must be implemented");
  }

  get isCancelled() {
    return true;
  }
}

export class CompletionProvider {
  [key: string]: IAnyValue;

  isTriggerCharacter(_ch: string): boolean {
    return false;
  }

  provideCompletions(_context: CompletionContext, _receiver: CompletionReceiver): void {
    // Host app should implement.
  }
}

class ManagedCompletionReceiver extends CompletionReceiver {
  [key: string]: IAnyValue;

  constructor(manager:IAnyValue, provider:IAnyValue, generation:number) {
    super();
    this._manager = manager;
    this._provider = provider;
    this._generation = generation;
    this._cancelled = false;
  }

  cancel() {
    this._cancelled = true;
  }

  accept(result:IAnyValue) {
    if (this._cancelled || this._generation !== this._manager._generation) {
      return false;
    }
    const normalized = result instanceof CompletionResult
      ? result
      : new CompletionResult(result?.items ?? [], result?.isIncomplete ?? false);
    this._manager._onProviderResult(this._provider, normalized, this._generation);
    return true;
  }

  get isCancelled() {
    return this._cancelled || this._generation !== this._manager._generation;
  }
}

interface ICompletionProviderLike {
  isTriggerCharacter?: (ch: string) => boolean;
  provideCompletions: (context: IAnyValue, receiver: CompletionReceiver) => void;
}

interface ICompletionListenerLike {
  onItemsUpdated?: (items: CompletionItem[]) => void;
  onDismissed?: () => void;
}

interface ICompletionManagerOptions {
  buildContext?: (triggerKind: number, triggerCharacter: string) => IAnyValue | null;
  onItemsUpdated?: (items: CompletionItem[]) => void;
  onDismissed?: () => void;
  debounceCharacterMs?: number;
  debounceInvokedMs?: number;
}

export class CompletionProviderManager {
  _providers: Set<ICompletionProviderLike>;
  _activeReceivers: Map<ICompletionProviderLike, ManagedCompletionReceiver>;
  _generation: number;
  _mergedItems: CompletionItem[];
  _buildContext: ((triggerKind: number, triggerCharacter: string) => IAnyValue | null) | null;
  _onItemsUpdated: ((items: CompletionItem[]) => void) | null;
  _onDismissed: (() => void) | null;
  _debounceCharacterMs: number;
  _debounceInvokedMs: number;
  _lastTriggerKind: number;
  _lastTriggerChar: string | null;
  _refreshTimer: ITimeoutHandle | 0;

  constructor(options:ICompletionManagerOptions = {}) {
    this._providers = new Set();
    this._activeReceivers = new Map();
    this._generation = 0;
    this._mergedItems = [];

    this._buildContext = typeof options.buildContext === "function" ? options.buildContext : null;
    this._onItemsUpdated = typeof options.onItemsUpdated === "function" ? options.onItemsUpdated : null;
    this._onDismissed = typeof options.onDismissed === "function" ? options.onDismissed : null;

    this._debounceCharacterMs = Math.max(
      0,
      toInt(options.debounceCharacterMs, DEFAULT_COMPLETION_DEBOUNCE_CHARACTER_MS),
    );
    this._debounceInvokedMs = Math.max(
      0,
      toInt(options.debounceInvokedMs, DEFAULT_COMPLETION_DEBOUNCE_INVOKED_MS),
    );

    this._lastTriggerKind = CompletionTriggerKind.INVOKED;
    this._lastTriggerChar = null;
    this._refreshTimer = 0;
  }

  setListener(listener:ICompletionListenerLike | null = null) {
    this._onItemsUpdated = typeof listener?.onItemsUpdated === "function" ? listener.onItemsUpdated : null;
    this._onDismissed = typeof listener?.onDismissed === "function" ? listener.onDismissed : null;
  }

  addProvider(provider:ICompletionProviderLike) {
    if (!provider) {
      return;
    }
    this._providers.add(provider);
  }

  removeProvider(provider:ICompletionProviderLike) {
    if (!provider) {
      return;
    }
    this._providers.delete(provider);
    const receiver = this._activeReceivers.get(provider);
    if (receiver) {
      receiver.cancel();
      this._activeReceivers.delete(provider);
    }
  }

  isTriggerCharacter(ch:string) {
    const chText = String(ch ?? "");
    for (const provider of this._providers) {
      if (safeCall(() => provider.isTriggerCharacter?.(chText))) {
        return true;
      }
    }
    return false;
  }

  triggerCompletion(triggerKind:number = CompletionTriggerKind.INVOKED, triggerCharacter:string | null = null) {
    if (this._providers.size === 0) {
      return;
    }

    this._lastTriggerKind = toInt(triggerKind, CompletionTriggerKind.INVOKED);
    this._lastTriggerChar = triggerCharacter == null ? null : String(triggerCharacter);

    if (this._refreshTimer) {
      clearTimeout(this._refreshTimer);
      this._refreshTimer = 0;
    }

    const delay = this._lastTriggerKind === CompletionTriggerKind.INVOKED
      ? this._debounceInvokedMs
      : this._debounceCharacterMs;

    this._refreshTimer = setTimeout(() => {
      this._refreshTimer = 0;
      this._executeRefresh(this._lastTriggerKind, this._lastTriggerChar);
    }, Math.max(0, delay));
  }

  showItems(items:IAnyValue[]) {
    if (this._refreshTimer) {
      clearTimeout(this._refreshTimer);
      this._refreshTimer = 0;
    }

    this._generation += 1;
    this._cancelAllReceivers();

    this._mergedItems = normalizeCompletionItems(items);
    if (this._mergedItems.length === 0) {
      this._emitDismiss();
      return;
    }

    this._emitItemsUpdated(this._mergedItems);
  }

  dismiss() {
    if (this._refreshTimer) {
      clearTimeout(this._refreshTimer);
      this._refreshTimer = 0;
    }

    this._generation += 1;
    this._cancelAllReceivers();
    this._mergedItems = [];
    this._emitDismiss();
  }

  _executeRefresh(triggerKind:number, triggerCharacter:string | null) {
    this._generation += 1;
    const generation = this._generation;

    this._cancelAllReceivers();
    this._mergedItems = [];

    const context = this._buildContext
      ? this._buildContext(triggerKind, triggerCharacter ?? "")
      : null;

    if (!context) {
      this.dismiss();
      return;
    }

    for (const provider of this._providers) {
      const receiver = new ManagedCompletionReceiver(this, provider, generation);
      this._activeReceivers.set(provider, receiver);
      try {
        provider.provideCompletions(context, receiver);
      } catch (error) {
        console.error("Completion provider error:", error);
      }
    }
  }

  _cancelAllReceivers() {
    this._activeReceivers.forEach((receiver:IAnyValue) => {
      receiver.cancel();
    });
    this._activeReceivers.clear();
  }

  _onProviderResult(_provider:ICompletionProviderLike, result:IAnyValue, generation:number) {
    if (generation !== this._generation) {
      return;
    }

    this._mergedItems.push(...normalizeCompletionItems(result.items));
    this._mergedItems.sort((a:IAnyValue, b:IAnyValue) => {
      const keyA = a.sortKey || a.label;
      const keyB = b.sortKey || b.label;
      return keyA.localeCompare(keyB);
    });

    if (this._mergedItems.length === 0) {
      this._emitDismiss();
      return;
    }

    this._emitItemsUpdated(this._mergedItems);
  }

  _emitItemsUpdated(items:IAnyValue[]) {
    if (this._onItemsUpdated) {
      this._onItemsUpdated(items.slice());
    }
  }

  _emitDismiss() {
    if (this._onDismissed) {
      this._onDismissed();
    }
  }
}
export const DecorationType = Object.freeze({
  SYNTAX_HIGHLIGHT: 1 << 0,
  SEMANTIC_HIGHLIGHT: 1 << 1,
  INLAY_HINT: 1 << 2,
  DIAGNOSTIC: 1 << 3,
  FOLD_REGION: 1 << 4,
  INDENT_GUIDE: 1 << 5,
  BRACKET_GUIDE: 1 << 6,
  FLOW_GUIDE: 1 << 7,
  SEPARATOR_GUIDE: 1 << 8,
  GUTTER_ICON: 1 << 9,
  PHANTOM_TEXT: 1 << 10,
});

export const DecorationApplyMode = Object.freeze({
  MERGE: 0,
  REPLACE_ALL: 1,
  REPLACE_RANGE: 2,
});

export const DecorationTextChangeMode = Object.freeze({
  INCREMENTAL: "incremental",
  FULL: "full",
  DISABLED: "disabled",
});

export const DecorationResultDispatchMode = Object.freeze({
  BOTH: "both",
  SYNC: "sync",
  ASYNC: "async",
});

export const DecorationProviderCallMode = Object.freeze({
  SYNC: "sync",
  ASYNC: "async",
});

export class DecorationContext {
  [key: string]: IAnyValue;

  constructor({
    visibleStartLine = 0,
    visibleEndLine = -1,
    viewportStartLine = visibleStartLine,
    viewportEndLine = visibleEndLine,
    totalLineCount = 0,
    textChanges = [],
    languageConfiguration = null,
    editorMetadata = null,
  }: {
    visibleStartLine?: number;
    visibleEndLine?: number;
    viewportStartLine?: number;
    viewportEndLine?: number;
    totalLineCount?: number;
    textChanges?: ITextChange[];
    languageConfiguration?: IAnyRecord | null;
    editorMetadata?: IAnyRecord | null;
  } = {}) {
    this.visibleStartLine = ensureLine(visibleStartLine);
    this.visibleEndLine = toInt(visibleEndLine, -1);
    this.viewportStartLine = ensureLine(viewportStartLine);
    this.viewportEndLine = toInt(viewportEndLine, this.visibleEndLine);
    this.totalLineCount = Math.max(0, toInt(totalLineCount, 0));
    this.textChanges = asArray(textChanges).map((change:IEditorTextChange) => ({
      range: ensureRange(change.range),
      oldText: String(change.oldText ?? (change as IAnyRecord).old_text ?? ""),
      newText: String(change.newText ?? (change as IAnyRecord).new_text ?? ""),
    }));
    this.languageConfiguration = languageConfiguration;
    this.editorMetadata = editorMetadata;
  }
}

export class DecorationResult {
  [key: string]: IAnyValue;

  constructor(init: IAnyRecord = {}) {
    this.syntaxSpans = init.syntaxSpans ?? null;
    this.semanticSpans = init.semanticSpans ?? null;
    this.inlayHints = init.inlayHints ?? null;
    this.diagnostics = init.diagnostics ?? null;
    this.indentGuides = init.indentGuides ?? null;
    this.bracketGuides = init.bracketGuides ?? null;
    this.flowGuides = init.flowGuides ?? null;
    this.separatorGuides = init.separatorGuides ?? null;
    this.foldRegions = init.foldRegions ?? null;
    this.gutterIcons = init.gutterIcons ?? null;
    this.phantomTexts = init.phantomTexts ?? null;

    this.syntaxSpansMode = toInt(init.syntaxSpansMode, DecorationApplyMode.MERGE);
    this.semanticSpansMode = toInt(init.semanticSpansMode, DecorationApplyMode.MERGE);
    this.inlayHintsMode = toInt(init.inlayHintsMode, DecorationApplyMode.MERGE);
    this.diagnosticsMode = toInt(init.diagnosticsMode, DecorationApplyMode.MERGE);
    this.indentGuidesMode = toInt(init.indentGuidesMode, DecorationApplyMode.MERGE);
    this.bracketGuidesMode = toInt(init.bracketGuidesMode, DecorationApplyMode.MERGE);
    this.flowGuidesMode = toInt(init.flowGuidesMode, DecorationApplyMode.MERGE);
    this.separatorGuidesMode = toInt(init.separatorGuidesMode, DecorationApplyMode.MERGE);
    this.foldRegionsMode = toInt(init.foldRegionsMode, DecorationApplyMode.MERGE);
    this.gutterIconsMode = toInt(init.gutterIconsMode, DecorationApplyMode.MERGE);
    this.phantomTextsMode = toInt(init.phantomTextsMode, DecorationApplyMode.MERGE);
  }
}

export class DecorationReceiver {
  [key: string]: IAnyValue;

  accept(_result:IAnyValue) {
    throw new Error("DecorationReceiver.accept must be implemented");
  }

  get isCancelled() {
    return true;
  }
}

export class DecorationProvider {
  [key: string]: IAnyValue;

  getCapabilities() {
    return DecorationType.SYNTAX_HIGHLIGHT;
  }

  provideDecorations(_context:IAnyValue, _receiver:IAnyValue) {
    // Host app should implement.
  }
}

function splitSourceLines(text:string) {
  const lines = String(text ?? "").split("\n");
  if (lines.length === 0) {
    return [""];
  }
  return lines;
}

function safeDeleteNativeHandle(handle:IAnyValue) {
  if (handle && typeof handle.delete === "function") {
    handle.delete();
  }
}

function iterateNativeList(list:IAnyValue, fn:(...args: IAnyValue[]) => IAnyValue) {
  if (!list || typeof fn !== "function") {
    return;
  }
  if (Array.isArray(list)) {
    list.forEach((item:IAnyValue, index:number) => fn(item, index));
    return;
  }
  if (typeof list.size === "function" && typeof list.get === "function") {
    const size = Math.max(0, toInt(list.size(), 0));
    for (let i = 0; i < size; i += 1) {
      fn(list.get(i), i);
    }
  }
}

function extractSingleLineStyleSpan(token:IAnyValue) {
  if (!token || !token.range || !token.range.start || !token.range.end) {
    return null;
  }
  const styleId = toInt(token.styleId ?? token.style_id, 0);
  if (styleId <= 0) {
    return null;
  }
  const startLine = toInt(token.range.start.line, 0);
  const endLine = toInt(token.range.end.line, startLine);
  const startColumn = Math.max(0, toInt(token.range.start.column, 0));
  const endColumn = Math.max(0, toInt(token.range.end.column, startColumn));
  if (startLine < 0 || startLine !== endLine || endColumn <= startColumn) {
    return null;
  }
  return {
    line: startLine,
    column: startColumn,
    length: endColumn - startColumn,
    styleId,
  };
}

function extractStyleSpansFromLineHighlight(lineHighlight:IAnyValue, expectedLine:IAnyValue = null) {
  const out:Array<{ column: number; length: number; styleId: number }> = [];
  if (!lineHighlight) {
    return out;
  }
  iterateNativeList(lineHighlight.spans, (token:IAnyValue) => {
    const span = extractSingleLineStyleSpan(token);
    if (!span) {
      return;
    }
    if (expectedLine != null && span.line !== expectedLine) {
      return;
    }
    out.push({
      column: span.column,
      length: span.length,
      styleId: span.styleId,
    });
  });
  out.sort((a:IAnyValue, b:IAnyValue) => a.column - b.column);
  return out;
}

function withSweetLineTextRange(sweetLine:IAnyValue, range:ITextRange, fn:(...args: IAnyValue[]) => IAnyValue) {
  const slRange = new sweetLine.TextRange();
  const start = new sweetLine.TextPosition();
  const end = new sweetLine.TextPosition();

  start.line = Math.max(0, toInt(range?.start?.line, 0));
  start.column = Math.max(0, toInt(range?.start?.column, 0));
  start.index = 0;

  end.line = Math.max(0, toInt(range?.end?.line, start.line));
  end.column = Math.max(0, toInt(range?.end?.column, start.column));
  end.index = 0;

  slRange.start = start;
  slRange.end = end;

  try {
    return fn(slRange);
  } finally {
    safeDeleteNativeHandle(start);
    safeDeleteNativeHandle(end);
    safeDeleteNativeHandle(slRange);
  }
}

export class SweetLineIncrementalDecorationProvider extends DecorationProvider {
  [key: string]: IAnyValue;

  constructor(options:IAnyRecord = {}) {
    super();
    this._sweetLine = options.sweetLine ?? options.runtime?.sweetLine ?? null;
    this._highlightEngine = options.highlightEngine ?? options.runtime?.engine ?? null;

    this._defaultFileName = String(options.defaultFileName ?? "example.cpp");
    this._sourceFileName = this._defaultFileName;
    this._sourceText = "";
    this._sourceLines = [""];

    this._analysisDocument = null;
    this._documentAnalyzer = null;
    this._cacheHighlight = null;
    this._analysisReady = false;
    this._analyzedFileName = "";
    this._textAnalyzer = null;
    this._lineInfo = null;
    this._lineAnalyzeTimer = 0;
    this._lineAnalyzeJobId = 0;
    this._lineAnalyzeTargetRange = { start: 0, end: -1 };
    this._lineAnalyzeCursor = 0;
    this._lineAnalyzeCursorState = 0;
    this._lineAnalyzeCursorOffset = 0;
    this._lineStartStates = [0];
    this._lineStartOffsets = [0];
    this._lineSpanCache = new Map();

    const maxRenderLinesValue = Number(options.maxRenderLinesPerPass);
    this._maxRenderLinesPerPass = Number.isFinite(maxRenderLinesValue)
      ? Math.max(1, toInt(maxRenderLinesValue, 1))
      : Number.POSITIVE_INFINITY;
    this._syntaxSpansMode = toInt(options.syntaxSpansMode, DecorationApplyMode.MERGE);
    this._capabilities = toInt(
      options.capabilities,
      DecorationType.SYNTAX_HIGHLIGHT,
    ) | DecorationType.SYNTAX_HIGHLIGHT;

    this._resolveFileName = typeof options.resolveFileName === "function"
      ? options.resolveFileName
      : null;
    this._buildAnalysisUri = typeof options.buildAnalysisUri === "function"
      ? options.buildAnalysisUri
      : (fileName:string) => `file:///${String(fileName || this._defaultFileName)}`;
    this._decorate = typeof options.decorate === "function"
      ? options.decorate
      : null;
    this._getDocumentText = typeof options.getDocumentText === "function"
      ? options.getDocumentText
      : null;
    this._syncSourceOnTextChange = options.syncSourceOnTextChange !== false;
    this._lineAnalyzeChunkBudgetMs = Math.max(
      1,
      Number.isFinite(Number(options.lineAnalyzeChunkBudgetMs))
        ? Number(options.lineAnalyzeChunkBudgetMs)
        : DEFAULT_LINE_ANALYZE_CHUNK_BUDGET_MS,
    );
    this._lineAnalyzeChunkMaxLines = Math.max(
      1,
      toInt(options.lineAnalyzeChunkMaxLines, 160),
    );
    this._lazyPrefetchMultiplier = Math.max(
      1,
      Number.isFinite(Number(options.lazyPrefetchMultiplier))
        ? Number(options.lazyPrefetchMultiplier)
        : 1.75,
    );
    this._lineAnalyzeNoChunkLineThreshold = Math.max(
      1,
      toInt(options.lineAnalyzeNoChunkLineThreshold, 2000),
    );

    this.setDocumentSource(
      options.fileName ?? options.sourceFileName ?? this._defaultFileName,
      options.text ?? options.sourceText ?? "",
    );
  }

  getCapabilities() {
    return this._capabilities;
  }

  dispose() {
    this._disposeAnalyzer();
  }

  getLineCount() {
    return Math.max(0, this._sourceLines.length);
  }

  setDocumentSource(fileName:string, text:string) {
    this._sourceFileName = String(fileName || this._defaultFileName);
    this._setSourceText(text);
    this._resetLineAnalyzeState();
    this._disposeAnalyzer();
  }

  provideDecorations(context:IAnyValue, receiver:IAnyValue) {
    if (!this._sweetLine || !this._highlightEngine || !receiver) {
      return;
    }

    const changes = asArray(context?.textChanges).map((change:IEditorTextChange) => ({
      range: ensureRange(change?.range),
      oldText: String(change?.oldText ?? (change as IAnyRecord | null | undefined)?.old_text ?? ""),
      newText: String(change?.newText ?? (change as IAnyRecord | null | undefined)?.new_text ?? ""),
    }));

    const resolvedFileName = this._resolveContextFileName(context);
    const fileChanged = resolvedFileName !== this._analyzedFileName;
    this._sourceFileName = resolvedFileName;

    if ((fileChanged || !this._analysisReady) && this._getDocumentText) {
      this._syncSourceFromDocument();
    } else if (changes.length > 0) {
      this._applyTextChanges(changes);
    }

    if (!this._ensureTextAnalyzer(resolvedFileName, fileChanged)) {
      return;
    }
    if (changes.length > 0) {
      this._invalidateLineAnalyzeByChanges(changes);
    }

    const totalLineCount = Math.max(
      this._sourceLines.length,
      Math.max(0, toInt(context?.totalLineCount, this._sourceLines.length)),
    );

    const visibleRange = this._buildVisibleRangeForRendering(context, totalLineCount);
    if (visibleRange.end < visibleRange.start) {
      return;
    }

    const analyzeRange = this._buildLazyAnalyzeRange(visibleRange, totalLineCount);
    const shouldBypassChunkAnalyze = totalLineCount > 0
      && totalLineCount < this._lineAnalyzeNoChunkLineThreshold;
    if (shouldBypassChunkAnalyze) {
      this._cancelPendingLineAnalyze();
      this._analyzeLineRangeSynchronously(0, totalLineCount - 1);
    }
    const syntaxSpans = this._collectCachedSyntaxSpans(analyzeRange);
    receiver.accept(new DecorationResult({
      syntaxSpans,
      syntaxSpansMode: DecorationApplyMode.REPLACE_RANGE,
    }));
    if (!shouldBypassChunkAnalyze) {
      this._scheduleLineAnalyze(analyzeRange, receiver);
    }

    if (!this._decorate) {
      return;
    }

    const extraPatch = safeCall(() => this._decorate({
      context,
      receiver,
      fileName: resolvedFileName,
      visibleRange,
      sourceText: this._sourceText,
      sourceLines: this._sourceLines,
      totalLineCount,
      cacheHighlight: this._cacheHighlight,
    }));
    if (!extraPatch) {
      return;
    }

    receiver.accept(
      extraPatch instanceof DecorationResult
        ? extraPatch
        : new DecorationResult(extraPatch),
    );
  }

  _buildVisibleRangeForRendering(context:IAnyValue, totalLineCount:number) {
    const viewportStartLine = context?.viewportStartLine ?? context?.visibleStartLine ?? 0;
    const viewportEndLine = context?.viewportEndLine ?? context?.visibleEndLine ?? (viewportStartLine + 120);
    const viewportRange = clampVisibleLineRange(
      viewportStartLine,
      viewportEndLine,
      totalLineCount,
      this._maxRenderLinesPerPass,
    );
    if (viewportRange.end < viewportRange.start) {
      return viewportRange;
    }

    const viewportLineCount = viewportRange.end - viewportRange.start + 1;
    const targetLineCount = Math.max(1, Math.ceil(viewportLineCount * 1.75));
    const extraLineCount = Math.max(0, targetLineCount - viewportLineCount);
    const extraTop = Math.floor(extraLineCount / 2);
    const extraBottom = extraLineCount - extraTop;

    return clampVisibleLineRange(
      viewportRange.start - extraTop,
      viewportRange.end + extraBottom,
      totalLineCount,
      this._maxRenderLinesPerPass,
    );
  }

  _buildLazyAnalyzeRange(visibleRange:IVisibleLineRange, totalLineCount:number) {
    const start = Math.max(0, toInt(visibleRange?.start, 0));
    const end = Math.max(start - 1, toInt(visibleRange?.end, start - 1));
    if (end < start) {
      return { start, end };
    }
    const lineCount = end - start + 1;
    const targetLineCount = Math.max(1, Math.ceil(lineCount * this._lazyPrefetchMultiplier));
    const extraLineCount = Math.max(0, targetLineCount - lineCount);
    const extraTop = Math.floor(extraLineCount / 2);
    const extraBottom = extraLineCount - extraTop;
    return clampVisibleLineRange(
      start - extraTop,
      end + extraBottom,
      totalLineCount,
      this._maxRenderLinesPerPass,
    );
  }

  _resolveAnalyzerExtension(fileName:string) {
    const name = String(fileName || "");
    const dot = name.lastIndexOf(".");
    if (dot <= 0 || dot >= name.length - 1) {
      return "";
    }
    return `.${name.slice(dot + 1).toLowerCase()}`;
  }

  _ensureTextAnalyzer(fileName:string, fileChanged:boolean) {
    if (!fileChanged && this._analysisReady && this._textAnalyzer && this._lineInfo) {
      return true;
    }

    this._resetLineAnalyzeState();
    safeDeleteNativeHandle(this._textAnalyzer);
    safeDeleteNativeHandle(this._lineInfo);
    this._textAnalyzer = null;
    this._lineInfo = null;

    const extension = this._resolveAnalyzerExtension(fileName);
    let analyzer = null;
    if (extension && typeof this._highlightEngine?.createAnalyzerByExtension === "function") {
      analyzer = safeCall(() => this._highlightEngine.createAnalyzerByExtension(extension));
    }
    if (!analyzer && extension && typeof this._highlightEngine?.createAnalyzerByName === "function") {
      const syntaxName = extension.startsWith(".") ? extension.slice(1) : extension;
      analyzer = safeCall(() => this._highlightEngine.createAnalyzerByName(syntaxName));
    }
    if (!analyzer) {
      this._analysisReady = false;
      return false;
    }

    this._textAnalyzer = analyzer;
    this._lineInfo = new this._sweetLine.TextLineInfo();
    this._analysisReady = true;
    this._analyzedFileName = String(fileName || this._defaultFileName);
    this._cacheHighlight = null;
    return true;
  }

  _resetLineAnalyzeState() {
    if (this._lineAnalyzeTimer) {
      clearTimeout(this._lineAnalyzeTimer);
      this._lineAnalyzeTimer = 0;
    }
    this._lineAnalyzeJobId += 1;
    this._lineAnalyzeTargetRange = { start: 0, end: -1 };
    this._lineAnalyzeCursor = 0;
    this._lineAnalyzeCursorState = 0;
    this._lineAnalyzeCursorOffset = 0;
    this._lineStartStates = [0];
    this._lineStartOffsets = [0];
    this._lineSpanCache.clear();
  }

  _invalidateLineAnalyzeByChanges(changes:IEditorTextChange[]) {
    if (!changes || changes.length === 0) {
      return;
    }
    let startLine = Number.POSITIVE_INFINITY;
    changes.forEach((change:IEditorTextChange) => {
      const line = toInt(change?.range?.start?.line, Number.POSITIVE_INFINITY);
      if (Number.isFinite(line) && line < startLine) {
        startLine = line;
      }
    });
    if (!Number.isFinite(startLine)) {
      startLine = 0;
    }
    this._invalidateLineAnalyzeFromLine(startLine);
  }

  _invalidateLineAnalyzeFromLine(line:number) {
    const lineNo = Math.max(0, toInt(line, 0));
    const clamped = Math.min(lineNo, this._sourceLines.length);
    this._lineAnalyzeCursor = Math.min(this._lineAnalyzeCursor, clamped);
    this._lineAnalyzeCursorState = toInt(
      this._lineStartStates[this._lineAnalyzeCursor],
      this._lineAnalyzeCursor === 0 ? 0 : this._lineAnalyzeCursorState,
    );
    this._lineAnalyzeCursorOffset = toInt(
      this._lineStartOffsets[this._lineAnalyzeCursor],
      this._lineAnalyzeCursor === 0 ? 0 : this._lineAnalyzeCursorOffset,
    );
    this._lineStartStates.length = Math.max(1, Math.min(this._lineStartStates.length, clamped + 1));
    this._lineStartOffsets.length = Math.max(1, Math.min(this._lineStartOffsets.length, clamped + 1));
    for (const key of Array.from(this._lineSpanCache.keys()) as number[]) {
      if (key >= clamped) {
        this._lineSpanCache.delete(key);
      }
    }
  }

  _scheduleLineAnalyze(range:IVisibleLineRange, receiver:IAnyValue) {
    if (!this._textAnalyzer || !this._lineInfo || !receiver) {
      return;
    }
    const start = Math.max(0, toInt(range?.start, 0));
    const end = Math.max(start - 1, toInt(range?.end, start - 1));
    if (end < start) {
      return;
    }
    this._lineAnalyzeTargetRange = { start, end };
    this._lineAnalyzeJobId += 1;
    const jobId = this._lineAnalyzeJobId;
    if (this._lineAnalyzeTimer) {
      clearTimeout(this._lineAnalyzeTimer);
      this._lineAnalyzeTimer = 0;
    }
    this._lineAnalyzeTimer = setTimeout(() => {
      this._lineAnalyzeTimer = 0;
      this._runLineAnalyzeChunk(jobId, receiver);
    }, 0);
  }

  _cancelPendingLineAnalyze() {
    if (this._lineAnalyzeTimer) {
      clearTimeout(this._lineAnalyzeTimer);
      this._lineAnalyzeTimer = 0;
    }
    this._lineAnalyzeJobId += 1;
  }

  _analyzeLineRangeSynchronously(startLine:number, endLine:number) {
    const totalLines = Math.max(0, this._sourceLines.length);
    if (totalLines <= 0) {
      return 0;
    }
    const start = Math.max(0, toInt(startLine, 0));
    const end = Math.min(totalLines - 1, Math.max(start - 1, toInt(endLine, start - 1)));
    if (end < start) {
      return 0;
    }
    this._invalidateLineAnalyzeFromLine(start);
    let processed = 0;
    while (this._lineAnalyzeCursor <= end) {
      if (!this._analyzeOneLineAtCursor()) {
        break;
      }
      processed += 1;
    }
    return processed;
  }

  _runLineAnalyzeChunk(jobId:number, receiver:IAnyValue) {
    if (jobId !== this._lineAnalyzeJobId || !receiver || receiver.isCancelled) {
      return;
    }
    if (!this._textAnalyzer || !this._lineInfo) {
      return;
    }

    const totalLines = Math.max(0, this._sourceLines.length);
    const targetEnd = Math.min(totalLines - 1, Math.max(-1, toInt(this._lineAnalyzeTargetRange.end, -1)));
    if (targetEnd < 0 || this._lineAnalyzeCursor > targetEnd) {
      return;
    }

    const budgetMs = this._lineAnalyzeChunkBudgetMs;
    const maxLines = this._lineAnalyzeChunkMaxLines;
    const chunkStartTime = performance.now();
    let processed = 0;

    while (this._lineAnalyzeCursor <= targetEnd && processed < maxLines) {
      if (processed > 0 && (performance.now() - chunkStartTime) >= budgetMs) {
        break;
      }
      if (!this._analyzeOneLineAtCursor()) {
        break;
      }
      processed += 1;
    }

    if (processed > 0 && !receiver.isCancelled) {
      receiver.accept(new DecorationResult({
        syntaxSpans: this._collectCachedSyntaxSpans(this._lineAnalyzeTargetRange),
        syntaxSpansMode: DecorationApplyMode.REPLACE_RANGE,
      }));
    }

    if (!receiver.isCancelled && jobId === this._lineAnalyzeJobId && this._lineAnalyzeCursor <= targetEnd) {
      this._lineAnalyzeTimer = setTimeout(() => {
        this._lineAnalyzeTimer = 0;
        this._runLineAnalyzeChunk(jobId, receiver);
      }, 0);
    }
  }

  _analyzeOneLineAtCursor() {
    const line = this._lineAnalyzeCursor;
    if (line < 0 || line >= this._sourceLines.length) {
      return false;
    }
    const text = String(this._sourceLines[line] ?? "");
    const info = this._lineInfo;
    info.line = line;
    info.startState = toInt(this._lineAnalyzeCursorState, 0);
    info.startCharOffset = Math.max(0, toInt(this._lineAnalyzeCursorOffset, 0));

    let result = null;
    try {
      result = this._textAnalyzer.analyzeLine(text, info);
      const spans = extractStyleSpansFromLineHighlight(result?.highlight, line);
      this._lineSpanCache.set(line, spans);

      const nextState = toInt(result?.endState, info.startState);
      const charCount = Math.max(0, toInt(result?.charCount, text.length));
      const nextOffset = info.startCharOffset + charCount + 1;
      this._lineStartStates[line + 1] = nextState;
      this._lineStartOffsets[line + 1] = nextOffset;
      this._lineAnalyzeCursor += 1;
      this._lineAnalyzeCursorState = nextState;
      this._lineAnalyzeCursorOffset = nextOffset;
      return true;
    } catch (error) {
      console.error("SweetLine line analyze failed:", error);
      return false;
    } finally {
      safeDeleteNativeHandle(result);
    }
  }

  _collectCachedSyntaxSpans(visibleRange:IVisibleLineRange) {
    const out = new Map();
    const startLine = Math.max(0, toInt(visibleRange?.start, 0));
    const endLine = Math.max(startLine - 1, toInt(visibleRange?.end, startLine - 1));
    if (endLine < startLine) {
      return out;
    }
    for (let line = startLine; line <= endLine; line += 1) {
      if (!this._lineSpanCache.has(line)) {
        continue;
      }
      const spans = this._lineSpanCache.get(line) || [];
      out.set(
        line,
        spans.map((span:IAnyValue) => ({
          column: span.column,
          length: span.length,
          styleId: span.styleId,
        })),
      );
    }
    return out;
  }

  _setSourceText(text:string) {
    this._sourceText = normalizeNewlines(text);
    this._sourceLines = splitSourceLines(this._sourceText);
  }

  _resolveContextFileName(context:IAnyValue) {
    let fileName = this._sourceFileName || this._defaultFileName;
    const metadataFileName = context?.editorMetadata?.fileName;
    if (metadataFileName) {
      fileName = String(metadataFileName);
    }
    if (this._resolveFileName) {
      const resolved = safeCall(() => this._resolveFileName(context, fileName));
      if (resolved != null && resolved !== "") {
        fileName = String(resolved);
      }
    }
    return fileName || this._defaultFileName;
  }

  _syncSourceFromDocument() {
    if (!this._getDocumentText) {
      return false;
    }
    const sourceText = safeCall(() => this._getDocumentText());
    if (typeof sourceText !== "string") {
      return false;
    }
    const normalized = normalizeNewlines(sourceText);
    if (normalized === this._sourceText) {
      return false;
    }
    this._setSourceText(normalized);
    return true;
  }

  _applyTextChanges(changes:IEditorTextChange[]) {
    if (!changes || changes.length === 0) {
      return;
    }
    const normalizedChanges:ITextChange[] = changes.map((change:IEditorTextChange) => ({
      range: ensureRange(change?.range),
      oldText: String(change?.oldText ?? (change as IAnyRecord | null | undefined)?.old_text ?? ""),
      newText: String(change?.newText ?? (change as IAnyRecord | null | undefined)?.new_text ?? ""),
    }));
    this._sourceText = applyTextChangesToText(this._sourceText, normalizedChanges);
    this._sourceLines = splitSourceLines(this._sourceText);
  }

  _tryRebuildAnalyzer(fileName:string) {
    try {
      this._rebuildAnalyzer(fileName);
      return true;
    } catch (error) {
      console.error("SweetLine full analyze failed:", error);
      this._disposeAnalyzer();
      return false;
    }
  }

  _tryAnalyzeIncremental(changes:IEditorTextChange[], fileName:string) {
    try {
      const hasStructuralChange = changes.some((change:IEditorTextChange) => isLineStructureChange(change));
      if (hasStructuralChange) {
        this._rebuildAnalyzer(fileName);
        return true;
      }

      changes.forEach((change:IEditorTextChange) => {
        if (!change?.range) {
          return;
        }
        const newText = normalizeNewlines(change.newText ?? "");
        withSweetLineTextRange(this._sweetLine, change.range, (slRange:IAnyValue) => {
          this._cacheHighlight = this._documentAnalyzer.analyzeIncremental(slRange, newText);
        });
      });

      const shouldResyncText = changes.some((change:IEditorTextChange) => {
        const range = change?.range;
        if (!range || !range.start || !range.end) {
          return false;
        }
        if (range.start.line !== range.end.line) {
          return true;
        }
        return hasLineBreak(change.oldText ?? "") || hasLineBreak(change.newText ?? "");
      });

      if (this._syncSourceOnTextChange && this._getDocumentText && shouldResyncText) {
        const beforeSync = this._sourceText;
        const synced = this._syncSourceFromDocument();
        if (synced && this._sourceText !== beforeSync) {
          this._rebuildAnalyzer(fileName);
        }
      }
      return true;
    } catch (error) {
      console.error("SweetLine incremental analyze failed:", error);
      if (!this._tryRebuildAnalyzer(fileName)) {
        return false;
      }
      return true;
    }
  }

  _disposeAnalyzer() {
    if (this._lineAnalyzeTimer) {
      clearTimeout(this._lineAnalyzeTimer);
      this._lineAnalyzeTimer = 0;
    }
    safeDeleteNativeHandle(this._cacheHighlight);
    safeDeleteNativeHandle(this._documentAnalyzer);
    safeDeleteNativeHandle(this._analysisDocument);
    safeDeleteNativeHandle(this._textAnalyzer);
    safeDeleteNativeHandle(this._lineInfo);
    this._cacheHighlight = null;
    this._documentAnalyzer = null;
    this._analysisDocument = null;
    this._textAnalyzer = null;
    this._lineInfo = null;
    this._lineAnalyzeJobId += 1;
    this._lineAnalyzeTargetRange = { start: 0, end: -1 };
    this._lineAnalyzeCursor = 0;
    this._lineAnalyzeCursorState = 0;
    this._lineAnalyzeCursorOffset = 0;
    this._lineStartStates = [0];
    this._lineStartOffsets = [0];
    this._lineSpanCache.clear();
    this._analysisReady = false;
    this._analyzedFileName = "";
  }

  _rebuildAnalyzer(fileName:string) {
    this._disposeAnalyzer();
    this._analysisDocument = new this._sweetLine.Document(
      this._buildAnalysisUri(fileName),
      this._sourceText,
    );
    this._documentAnalyzer = this._highlightEngine.loadDocument(this._analysisDocument);
    this._cacheHighlight = this._documentAnalyzer.analyze();
    this._analysisReady = true;
    this._analyzedFileName = fileName;
  }

  _collectSyntaxSpans(visibleRange:IVisibleLineRange) {
    const out = new Map();
    const startLine = Math.max(0, toInt(visibleRange?.start, 0));
    const endLine = Math.max(startLine - 1, toInt(visibleRange?.end, startLine - 1));
    if (endLine < startLine) {
      return out;
    }

    const lineHighlights = this._cacheHighlight?.lines;
    if (!lineHighlights) {
      return out;
    }

    const getLineHighlight = (line:number) => {
      if (typeof lineHighlights.size === "function" && typeof lineHighlights.get === "function") {
        const total = Math.max(0, toInt(lineHighlights.size(), 0));
        if (line < 0 || line >= total) {
          return null;
        }
        return lineHighlights.get(line);
      }
      if (Array.isArray(lineHighlights)) {
        return lineHighlights[line] ?? null;
      }
      return null;
    };

    for (let line = startLine; line <= endLine; line += 1) {
      const lineHighlight = getLineHighlight(line);
      if (!lineHighlight) {
        continue;
      }
      iterateNativeList(lineHighlight.spans, (token:IAnyValue) => {
        const span = extractSingleLineStyleSpan(token);
        if (!span || span.line < startLine || span.line > endLine) {
          return;
        }
        let lineSpans = out.get(span.line);
        if (!lineSpans) {
          lineSpans = [];
          out.set(span.line, lineSpans);
        }
        lineSpans.push({
          column: span.column,
          length: span.length,
          styleId: span.styleId,
        });
      });
    }

    out.forEach((spans:IAnyValue[]) => {
      spans.sort((a:IAnyValue, b:IAnyValue) => a.column - b.column);
    });
    return out;
  }
}

class ManagedDecorationReceiver extends DecorationReceiver {
  [key: string]: IAnyValue;

  constructor(manager:IAnyValue, provider:IAnyValue, generation:number) {
    super();
    this._manager = manager;
    this._provider = provider;
    this._generation = generation;
    this._cancelled = false;
    this._inSyncPhase = true;
  }

  cancel() {
    this._cancelled = true;
  }

  markAsyncPhase() {
    this._inSyncPhase = false;
  }

  accept(result:IAnyValue) {
    if (this._cancelled || this._generation !== this._manager._generation) {
      return false;
    }

    const dispatchMode = this._manager._resultDispatchMode;
    if (dispatchMode === DecorationResultDispatchMode.SYNC && !this._inSyncPhase) {
      return false;
    }
    if (dispatchMode === DecorationResultDispatchMode.ASYNC && this._inSyncPhase) {
      return false;
    }

    const patch = result instanceof DecorationResult ? result : new DecorationResult(result || {});
    this._manager._onProviderPatch(this._provider, patch, this._generation);
    return true;
  }

  get isCancelled() {
    return this._cancelled || this._generation !== this._manager._generation;
  }
}

function cloneDecorationResult(result:IAnyValue) {
  return {
    syntaxSpans: cloneLineMap(result.syntaxSpans),
    semanticSpans: cloneLineMap(result.semanticSpans),
    inlayHints: cloneLineMap(result.inlayHints),
    diagnostics: cloneLineMap(result.diagnostics),
    indentGuides: cloneList(result.indentGuides),
    bracketGuides: cloneList(result.bracketGuides),
    flowGuides: cloneList(result.flowGuides),
    separatorGuides: cloneList(result.separatorGuides),
    foldRegions: cloneList(result.foldRegions),
    gutterIcons: cloneLineMap(result.gutterIcons),
    phantomTexts: cloneLineMap(result.phantomTexts),

    syntaxSpansMode: toInt(result.syntaxSpansMode, DecorationApplyMode.MERGE),
    semanticSpansMode: toInt(result.semanticSpansMode, DecorationApplyMode.MERGE),
    inlayHintsMode: toInt(result.inlayHintsMode, DecorationApplyMode.MERGE),
    diagnosticsMode: toInt(result.diagnosticsMode, DecorationApplyMode.MERGE),
    indentGuidesMode: toInt(result.indentGuidesMode, DecorationApplyMode.MERGE),
    bracketGuidesMode: toInt(result.bracketGuidesMode, DecorationApplyMode.MERGE),
    flowGuidesMode: toInt(result.flowGuidesMode, DecorationApplyMode.MERGE),
    separatorGuidesMode: toInt(result.separatorGuidesMode, DecorationApplyMode.MERGE),
    foldRegionsMode: toInt(result.foldRegionsMode, DecorationApplyMode.MERGE),
    gutterIconsMode: toInt(result.gutterIconsMode, DecorationApplyMode.MERGE),
    phantomTextsMode: toInt(result.phantomTextsMode, DecorationApplyMode.MERGE),
  };
}

function mergeDecorationPatch(target:IAnyValue, patch:IAnyValue) {
  const fields = [
    ["syntaxSpans", "syntaxSpansMode"],
    ["semanticSpans", "semanticSpansMode"],
    ["inlayHints", "inlayHintsMode"],
    ["diagnostics", "diagnosticsMode"],
    ["indentGuides", "indentGuidesMode"],
    ["bracketGuides", "bracketGuidesMode"],
    ["flowGuides", "flowGuidesMode"],
    ["separatorGuides", "separatorGuidesMode"],
    ["foldRegions", "foldRegionsMode"],
    ["gutterIcons", "gutterIconsMode"],
    ["phantomTexts", "phantomTextsMode"],
  ];

  fields.forEach(([dataKey, modeKey]:IAnyValue) => {
    if (patch[dataKey] != null) {
      target[dataKey] = patch[dataKey];
      target[modeKey] = patch[modeKey];
      return;
    }

    if (patch[modeKey] !== DecorationApplyMode.MERGE) {
      target[dataKey] = null;
      target[modeKey] = patch[modeKey];
    }
  });
}

function normalizeDecorationTextChangeMode(mode:IAnyValue) {
  const value = String(mode ?? "").toLowerCase();
  if (value === DecorationTextChangeMode.FULL) {
    return DecorationTextChangeMode.FULL;
  }
  if (value === DecorationTextChangeMode.DISABLED) {
    return DecorationTextChangeMode.DISABLED;
  }
  return DecorationTextChangeMode.INCREMENTAL;
}

function normalizeDecorationResultDispatchMode(mode:IAnyValue) {
  const value = String(mode ?? "").toLowerCase();
  if (value === DecorationResultDispatchMode.SYNC) {
    return DecorationResultDispatchMode.SYNC;
  }
  if (value === DecorationResultDispatchMode.ASYNC) {
    return DecorationResultDispatchMode.ASYNC;
  }
  return DecorationResultDispatchMode.BOTH;
}

function normalizeDecorationProviderCallMode(mode:IAnyValue) {
  const value = String(mode ?? "").toLowerCase();
  if (value === DecorationProviderCallMode.ASYNC) {
    return DecorationProviderCallMode.ASYNC;
  }
  return DecorationProviderCallMode.SYNC;
}

type IDecorationTextChangeMode = (typeof DecorationTextChangeMode)[keyof typeof DecorationTextChangeMode];
type IDecorationResultDispatchMode = (typeof DecorationResultDispatchMode)[keyof typeof DecorationResultDispatchMode];
type IDecorationProviderCallMode = (typeof DecorationProviderCallMode)[keyof typeof DecorationProviderCallMode];

interface IDecorationProviderLike {
  provideDecorations: (context: IAnyValue, receiver: DecorationReceiver) => void;
}

interface IDecorationProviderState {
  snapshot: IAnyRecord | null;
  activeReceiver: ManagedDecorationReceiver | null;
}

interface IDecorationManagerOptions {
  buildContext?: (input: IAnyRecord) => IAnyValue;
  getVisibleLineRange?: () => IAnyValue;
  ensureVisibleLineRange?: () => void;
  getTotalLineCount?: () => IAnyValue;
  getLanguageConfiguration?: () => ILanguageConfiguration | IAnyRecord | null;
  getMetadata?: () => IEditorMetadata | IAnyRecord | null;
  onApplyMerged?: (merged: IAnyRecord, visibleRange: IVisibleLineRange) => void;
  scrollRefreshMinIntervalMs?: number;
  overscanViewportMultiplier?: number;
  textChangeMode?: IDecorationTextChangeMode;
  resultDispatchMode?: IDecorationResultDispatchMode;
  providerCallMode?: IDecorationProviderCallMode;
  applySynchronously?: boolean;
}

export class DecorationProviderManager {
  _providers: Set<IDecorationProviderLike>;
  _providerStates: Map<IDecorationProviderLike, IDecorationProviderState>;
  _buildContext: ((input: IAnyRecord) => IAnyValue) | null;
  _getVisibleLineRange: (() => IAnyValue) | null;
  _ensureVisibleLineRange: (() => void) | null;
  _getTotalLineCount: (() => IAnyValue) | null;
  _getLanguageConfiguration: (() => ILanguageConfiguration | IAnyRecord | null) | null;
  _getMetadata: (() => IEditorMetadata | IAnyRecord | null) | null;
  _onApplyMerged: ((merged: IAnyRecord, visibleRange: IVisibleLineRange) => void) | null;
  _refreshTimer: ITimeoutHandle | 0;
  _scrollRefreshTimer: ITimeoutHandle | 0;
  _applyTimer: ITimeoutHandle | 0;
  _pendingTextChanges: ITextChange[];
  _applyScheduled: boolean;
  _generation: number;
  _lastVisibleStartLine: number;
  _lastVisibleEndLine: number;
  _lastScrollRefreshTickMs: number;
  _scrollRefreshMinIntervalMs: number;
  _overscanViewportMultiplier: number;
  _textChangeMode: IDecorationTextChangeMode;
  _resultDispatchMode: IDecorationResultDispatchMode;
  _providerCallMode: IDecorationProviderCallMode;
  _applySynchronously: boolean;

  constructor(options:IDecorationManagerOptions = {}) {
    this._providers = new Set();
    this._providerStates = new Map();

    this._buildContext = typeof options.buildContext === "function" ? options.buildContext : null;
    this._getVisibleLineRange = typeof options.getVisibleLineRange === "function" ? options.getVisibleLineRange : null;
    this._ensureVisibleLineRange = typeof options.ensureVisibleLineRange === "function"
      ? options.ensureVisibleLineRange
      : null;
    this._getTotalLineCount = typeof options.getTotalLineCount === "function" ? options.getTotalLineCount : null;
    this._getLanguageConfiguration = typeof options.getLanguageConfiguration === "function"
      ? options.getLanguageConfiguration
      : null;
    this._getMetadata = typeof options.getMetadata === "function" ? options.getMetadata : null;
    this._onApplyMerged = typeof options.onApplyMerged === "function" ? options.onApplyMerged : null;

    this._refreshTimer = 0;
    this._scrollRefreshTimer = 0;
    this._applyTimer = 0;

    this._pendingTextChanges = [];
    this._applyScheduled = false;
    this._generation = 0;
    this._lastVisibleStartLine = 0;
    this._lastVisibleEndLine = -1;
    this._lastScrollRefreshTickMs = 0;

    this._scrollRefreshMinIntervalMs = DEFAULT_DECORATION_SCROLL_REFRESH_MIN_INTERVAL_MS;
    this._overscanViewportMultiplier = DEFAULT_DECORATION_OVERSCAN_VIEWPORT_MULTIPLIER;
    this._textChangeMode = DecorationTextChangeMode.INCREMENTAL;
    this._resultDispatchMode = DecorationResultDispatchMode.BOTH;
    this._providerCallMode = DecorationProviderCallMode.SYNC;
    this._applySynchronously = false;

    this.setOptions(options);
  }

  setOptions(options:IDecorationManagerOptions = {}) {
    if (!options || typeof options !== "object") {
      return;
    }

    if ("scrollRefreshMinIntervalMs" in options) {
      this._scrollRefreshMinIntervalMs = Math.max(
        0,
        toInt(options.scrollRefreshMinIntervalMs, DEFAULT_DECORATION_SCROLL_REFRESH_MIN_INTERVAL_MS),
      );
    }
    if ("overscanViewportMultiplier" in options) {
      this._overscanViewportMultiplier = Math.max(
        0,
        Number(options.overscanViewportMultiplier ?? DEFAULT_DECORATION_OVERSCAN_VIEWPORT_MULTIPLIER),
      );
    }
    if ("textChangeMode" in options) {
      this._textChangeMode = normalizeDecorationTextChangeMode(options.textChangeMode);
    }
    if ("resultDispatchMode" in options) {
      this._resultDispatchMode = normalizeDecorationResultDispatchMode(options.resultDispatchMode);
    }
    if ("providerCallMode" in options) {
      this._providerCallMode = normalizeDecorationProviderCallMode(options.providerCallMode);
    }
    if ("applySynchronously" in options) {
      this._applySynchronously = Boolean(options.applySynchronously);
    }
  }

  getOptions() {
    return {
      scrollRefreshMinIntervalMs: this._scrollRefreshMinIntervalMs,
      overscanViewportMultiplier: this._overscanViewportMultiplier,
      textChangeMode: this._textChangeMode,
      resultDispatchMode: this._resultDispatchMode,
      providerCallMode: this._providerCallMode,
      applySynchronously: this._applySynchronously,
    };
  }

  addProvider(provider:IDecorationProviderLike) {
    if (!provider) {
      return;
    }
    this._providers.add(provider);
    if (!this._providerStates.has(provider)) {
      this._providerStates.set(provider, {
        snapshot: null,
        activeReceiver: null,
      });
    }
    this.requestRefresh();
  }

  removeProvider(provider:IDecorationProviderLike) {
    if (!provider) {
      return;
    }

    this._providers.delete(provider);
    const state = this._providerStates.get(provider);
    if (state?.activeReceiver) {
      state.activeReceiver.cancel();
    }
    this._providerStates.delete(provider);

    this._scheduleApply();
  }

  requestRefresh() {
    this._scheduleRefresh(0, null);
  }

  onDocumentLoaded() {
    this._scheduleRefresh(0, null);
  }

  onTextChanged(changes:IEditorTextChange[]) {
    if (this._textChangeMode === DecorationTextChangeMode.DISABLED) {
      return;
    }
    this._scheduleRefresh(50, changes);
  }

  onScrollChanged() {
    const now = Date.now();
    const elapsed = now - this._lastScrollRefreshTickMs;
    const delay = elapsed >= this._scrollRefreshMinIntervalMs
      ? 0
      : (this._scrollRefreshMinIntervalMs - elapsed);

    if (this._scrollRefreshTimer) {
      return;
    }

    this._scrollRefreshTimer = setTimeout(() => {
      this._scrollRefreshTimer = 0;
      if (this._refreshTimer) {
        clearTimeout(this._refreshTimer);
        this._refreshTimer = 0;
      }
      this._doRefresh();
      this._lastScrollRefreshTickMs = Date.now();
    }, Math.max(0, delay));
  }

  _scheduleRefresh(delayMs:IAnyValue, changes:IEditorTextChange[] | null) {
    let effectiveDelayMs = Math.max(0, toInt(delayMs, 0));
    if (changes && changes.length > 0) {
      const normalizedChanges:ITextChange[] = [];
      changes.forEach((change:IEditorTextChange) => {
        const normalizedChange = {
          range: ensureRange(change.range),
      oldText: String(change.oldText ?? (change as IAnyRecord).old_text ?? ""),
      newText: String(change.newText ?? (change as IAnyRecord).new_text ?? ""),
        };
        if (isLineStructureChange(normalizedChange)) {
          effectiveDelayMs = 0;
        }
        normalizedChanges.push(normalizedChange);
      });
      if (normalizedChanges.length > 0) {
        this._pendingTextChanges.push(...normalizedChanges);
      }
    }

    if (this._scrollRefreshTimer) {
      clearTimeout(this._scrollRefreshTimer);
      this._scrollRefreshTimer = 0;
    }

    if (this._refreshTimer) {
      clearTimeout(this._refreshTimer);
      this._refreshTimer = 0;
    }

    this._refreshTimer = setTimeout(() => {
      this._refreshTimer = 0;
      this._doRefresh();
    }, effectiveDelayMs);
  }

  _doRefresh() {
    this._generation += 1;
    const generation = this._generation;

    let visibleRange = this._resolveVisibleRange();
    if (visibleRange.end < visibleRange.start && this._ensureVisibleLineRange) {
      const ensureVisibleLineRange = this._ensureVisibleLineRange;
      safeCall(() => ensureVisibleLineRange());
      visibleRange = this._resolveVisibleRange();
    }
    this._lastVisibleStartLine = visibleRange.start;
    this._lastVisibleEndLine = visibleRange.end;

    const totalLineCount = Math.max(0, toInt(this._getTotalLineCount?.(), 0));
    const pendingChanges = this._pendingTextChanges.slice();
    this._pendingTextChanges = [];
    const contextChanges = this._textChangeMode === DecorationTextChangeMode.FULL
      ? []
      : pendingChanges;

    const contextRange = this._resolveContextRange(visibleRange, totalLineCount);
    const context = this._buildContext
      ? this._buildContext({
          visibleStartLine: contextRange.start,
          visibleEndLine: contextRange.end,
          viewportStartLine: visibleRange.start,
          viewportEndLine: visibleRange.end,
          totalLineCount,
          textChanges: contextChanges,
          languageConfiguration: this._getLanguageConfiguration?.() ?? null,
          editorMetadata: this._getMetadata?.() ?? null,
        })
      : new DecorationContext({
          visibleStartLine: contextRange.start,
          visibleEndLine: contextRange.end,
          viewportStartLine: visibleRange.start,
          viewportEndLine: visibleRange.end,
          totalLineCount,
          textChanges: contextChanges,
          languageConfiguration: this._getLanguageConfiguration?.() ?? null,
          editorMetadata: this._getMetadata?.() ?? null,
        });

    for (const provider of this._providers) {
      let state = this._providerStates.get(provider);
      if (!state) {
        state = { snapshot: null, activeReceiver: null };
        this._providerStates.set(provider, state);
      }

      if (state.activeReceiver) {
        state.activeReceiver.cancel();
      }

      const receiver = new ManagedDecorationReceiver(this, provider, generation);
      state.activeReceiver = receiver;
      this._invokeProvider(provider, context, receiver);
    }
  }

  _invokeProvider(provider:IDecorationProviderLike, context:IAnyValue, receiver:ManagedDecorationReceiver) {
    const run = () => {
      if (receiver.isCancelled) {
        return;
      }
      try {
        provider.provideDecorations(context, receiver);
      } catch (error) {
        console.error("Decoration provider error:", error);
      } finally {
        receiver.markAsyncPhase();
      }
    };

    if (this._providerCallMode === DecorationProviderCallMode.ASYNC) {
      setTimeout(run, 0);
      return;
    }
    run();
  }

  _resolveVisibleRange() {
    const range = this._getVisibleLineRange ? this._getVisibleLineRange() : null;
    const start = ensureLine(range?.start ?? range?.[0] ?? 0);
    const end = toInt(range?.end ?? range?.[1], -1);
    return { start, end };
  }

  _resolveContextRange(visibleRange:IVisibleLineRange, totalLineCount:number) {
    if (totalLineCount <= 0 || visibleRange.end < visibleRange.start) {
      return { start: visibleRange.start, end: visibleRange.end };
    }

    const viewportLineCount = visibleRange.end - visibleRange.start + 1;
    const overscan = Math.max(0, Math.ceil(viewportLineCount * this._overscanViewportMultiplier));

    return {
      start: Math.max(0, visibleRange.start - overscan),
      end: Math.min(totalLineCount - 1, visibleRange.end + overscan),
    };
  }

  _onProviderPatch(provider:IDecorationProviderLike, patch:IAnyValue, generation:number) {
    if (generation !== this._generation) {
      return;
    }

    const normalizedPatch = cloneDecorationResult(patch);
    let state = this._providerStates.get(provider);
    if (!state) {
      state = { snapshot: null, activeReceiver: null };
      this._providerStates.set(provider, state);
    }

    if (!state.snapshot) {
      state.snapshot = cloneDecorationResult(new DecorationResult());
    }

    mergeDecorationPatch(state.snapshot, normalizedPatch);
    this._scheduleApply();
  }

  _scheduleApply() {
    if (this._applyScheduled) {
      return;
    }

    this._applyScheduled = true;
    if (this._applySynchronously) {
      this._applyScheduled = false;
      this._applyMerged();
      return;
    }

    this._applyTimer = setTimeout(() => {
      this._applyTimer = 0;
      this._applyScheduled = false;
      this._applyMerged();
    }, 0);
  }

  _applyMerged() {
    const merged:IAnyRecord = {
      syntaxSpans: new Map(),
      semanticSpans: new Map(),
      inlayHints: new Map(),
      diagnostics: new Map(),
      indentGuides: null,
      bracketGuides: null,
      flowGuides: null,
      separatorGuides: null,
      foldRegions: [],
      gutterIcons: new Map(),
      phantomTexts: new Map(),

      syntaxSpansMode: DecorationApplyMode.MERGE,
      semanticSpansMode: DecorationApplyMode.MERGE,
      inlayHintsMode: DecorationApplyMode.MERGE,
      diagnosticsMode: DecorationApplyMode.MERGE,
      indentGuidesMode: DecorationApplyMode.MERGE,
      bracketGuidesMode: DecorationApplyMode.MERGE,
      flowGuidesMode: DecorationApplyMode.MERGE,
      separatorGuidesMode: DecorationApplyMode.MERGE,
      foldRegionsMode: DecorationApplyMode.MERGE,
      gutterIconsMode: DecorationApplyMode.MERGE,
      phantomTextsMode: DecorationApplyMode.MERGE,
    };

    for (const provider of this._providers) {
      const state = this._providerStates.get(provider);
      if (!state?.snapshot) {
        continue;
      }

      const snapshot = state.snapshot;

      merged.syntaxSpansMode = mergeMode(merged.syntaxSpansMode, snapshot.syntaxSpansMode);
      appendLineMap(merged.syntaxSpans, snapshot.syntaxSpans);

      merged.semanticSpansMode = mergeMode(merged.semanticSpansMode, snapshot.semanticSpansMode);
      appendLineMap(merged.semanticSpans, snapshot.semanticSpans);

      merged.inlayHintsMode = mergeMode(merged.inlayHintsMode, snapshot.inlayHintsMode);
      appendLineMap(merged.inlayHints, snapshot.inlayHints);

      merged.diagnosticsMode = mergeMode(merged.diagnosticsMode, snapshot.diagnosticsMode);
      appendLineMap(merged.diagnostics, snapshot.diagnostics);

      merged.gutterIconsMode = mergeMode(merged.gutterIconsMode, snapshot.gutterIconsMode);
      appendLineMap(merged.gutterIcons, snapshot.gutterIcons);

      merged.phantomTextsMode = mergeMode(merged.phantomTextsMode, snapshot.phantomTextsMode);
      appendLineMap(merged.phantomTexts, snapshot.phantomTexts);

      merged.indentGuidesMode = mergeMode(merged.indentGuidesMode, snapshot.indentGuidesMode);
      if (snapshot.indentGuides) {
        merged.indentGuides = cloneList(snapshot.indentGuides);
      }

      merged.bracketGuidesMode = mergeMode(merged.bracketGuidesMode, snapshot.bracketGuidesMode);
      if (snapshot.bracketGuides) {
        merged.bracketGuides = cloneList(snapshot.bracketGuides);
      }

      merged.flowGuidesMode = mergeMode(merged.flowGuidesMode, snapshot.flowGuidesMode);
      if (snapshot.flowGuides) {
        merged.flowGuides = cloneList(snapshot.flowGuides);
      }

      merged.separatorGuidesMode = mergeMode(merged.separatorGuidesMode, snapshot.separatorGuidesMode);
      if (snapshot.separatorGuides) {
        merged.separatorGuides = cloneList(snapshot.separatorGuides);
      }

      merged.foldRegionsMode = mergeMode(merged.foldRegionsMode, snapshot.foldRegionsMode);
      if (snapshot.foldRegions) {
        const foldRegions = cloneList(snapshot.foldRegions);
        if (foldRegions) {
          merged.foldRegions.push(...foldRegions);
        }
      }
    }

    if (this._onApplyMerged) {
      this._onApplyMerged(merged, {
        start: this._lastVisibleStartLine,
        end: this._lastVisibleEndLine,
        startLine: this._lastVisibleStartLine,
        endLine: this._lastVisibleEndLine,
      });
    }
  }
}
