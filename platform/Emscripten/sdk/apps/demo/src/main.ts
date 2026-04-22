import {
  CompletionItem,
  CompletionResult,
  DecorationApplyMode,
  DecorationProviderCallMode,
  DecorationResult,
  DecorationResultDispatchMode,
  DecorationTextChangeMode,
  countLogicalLines,
  createEditor,
  createModel,
  normalizeNewlines,
} from "@sweeteditor/sdk";

type SweetLineModuleLoader = (options?: Record<string, unknown>) => Promise<any>;
type LanguageKind = "cpp" | "java" | "kotlin" | "lua";
type DemoCodeLensItem = { column: number; text: string; commandId: number };
type DemoLinkSpan = { column: number; length: number; target: string };

interface IDemoCompletionItem {
  label: string;
  detail: string;
  kind: number;
  insertText: string;
  sortKey: string;
  insertTextFormat?: number;
}

interface IWidgetLike {
  registerTextStyle(styleId: number, color: number, backgroundColor?: number, fontStyle?: number): void;
  setContentStartPadding?(padding: number): void;
  setPerformanceOverlayEnabled?(enabled: boolean): void;
  setPerformanceOverlayVisible?(visible: boolean): void;
  addSweetLineDecorationProvider?(options: Record<string, unknown>): any;
  addCompletionProvider?(provider: unknown): void;
  clearAllDecorations?(): void;
  setDecorationProviderOptions?(options: Record<string, unknown>): void;
  setMetadata?(metadata: Record<string, unknown>): void;
  setLanguageConfiguration?(config: Record<string, unknown>): void;
  setScroll?(x: number, y: number): void;
  requestDecorationRefresh?(): void;
  setLineCodeLens?(line: number, items: Array<{ column?: number; text: string; commandId?: number; command_id?: number }>): void;
  setBatchLineCodeLens?(itemsByLine: Record<number, Array<{ column?: number; text: string; commandId?: number; command_id?: number }>>): void;
  clearCodeLens?(): void;
  setLineLinks?(line: number, links: DemoLinkSpan[]): void;
  setBatchLineLinks?(linksByLine: Record<number, DemoLinkSpan[]>): void;
  clearLinks?(): void;
  getLinkTargetAt?(line: number, column: number): string;
  subscribe?(eventType: string, listener: (event: any) => void): (() => void) | void;
  unsubscribe?(eventType: string, listener: (event: any) => void): void;
  getText?(): string;
  undo?(): void;
  redo?(): void;
  triggerCompletion?(): void;
  setCompositionEnabled?(enabled: boolean): void;
  isCompositionEnabled?(): boolean;
  openImeCandidate?(): void;
  closeImeCandidate?(): void;
}

const DEMO_FILE_FALLBACKS = Object.freeze({
  "CodeLensDemo.java": `package demo.codelens;

import java.util.ArrayList;
import java.util.List;

public class CodeLensDemo {
    public static void main(String[] args) {
        CodeLensDemo demo = new CodeLensDemo();
        demo.run();
    }

    public void run() {
        List<String> values = new ArrayList<>();
        values.add("alpha");
        values.add("beta");
        values.forEach(this::log);
    }

    private void log(String value) {
        System.out.println("value = " + value);
    }

    private int sum(int a, int b) {
        return a + b;
    }
}
`,
  "View.java": `package demo;

import android.view.View;

public class DemoView extends View {
    // TODO: replace demo magic color
    private static final int PRIMARY = 0XFF4ADE80;

    public DemoView(android.content.Context context) {
        super(context);
    }

    @Override
    protected void onDraw(android.graphics.Canvas canvas) {
        super.onDraw(canvas);
        if (canvas != null) {
            canvas.drawColor(PRIMARY);
        }
    }
}
`,
  "example.kt": `package demo

class DemoKotlin {
    // FIXME: compute from config
    private val accent = 0XFF60A5FA

    fun greet(name: String): String {
        return "Hello, $name"
    }
}
`,
  "example.lua": `local color = 0XFF34D399
local name = "OpenSweetEditor"

-- TODO: move to config
function greet(user)
  if user == nil then
    return "Hello, " .. name
  end
  return "Hello, " .. user
end
`,
  "nlohmann-json.hpp": `#pragma once
#include <string>
#include <vector>

namespace nlohmann {
class json {
public:
    // TODO: keep this demo header tiny for wasm page responsiveness
    static json parse(const std::string& text);
    bool contains(const std::string& key) const;
    std::string dump(int indent = -1) const;
};
}
`,
});

const STYLE = Object.freeze({
  KEYWORD: 1,
  TYPE: 2,
  STRING: 3,
  COMMENT: 4,
  BUILTIN: 5,
  NUMBER: 6,
  CLASS: 7,
  FUNCTION: 8,
  VARIABLE: 9,
  ANNOTATION: 10,
  PUNCTUATION: 11,
  PREPROCESSOR: 12,
  COLOR: 13,
});

const INLAY_COLOR_TYPE = 2;
const MAX_RENDER_LINES_PER_PASS = 420;
const SYNTAX_JSON_FILES = Object.freeze(["cpp.json", "java.json", "kotlin.json", "lua.json"]);
const CODELENS_DEMO_FILE = "CodeLensDemo.java";
const CODELENS_EVENT_STANDARD = "CodeLensClickEvent";
const CODELENS_EVENT_LEGACY = "CodeLensClick";
const LINK_EVENT_STANDARD = "LinkClickEvent";
const LINK_EVENT_LEGACY = "LinkClick";
const DEMO_EDITOR_FONT_FAMILY = [
  "\"0xProto Nerd Font Mono\"",
  "Hack",
  "\"Noto Sans Mono CJK SC\"",
  "\"Noto Sans Mono\"",
  "monospace",
].join(", ");

const MEMBER_COMPLETIONS: Readonly<Record<LanguageKind, IDemoCompletionItem[]>> = Object.freeze({
  cpp: [
    { label: "size", detail: "size_t", kind: CompletionItem.KIND_FUNCTION, insertText: "size()", sortKey: "a_size" },
    { label: "begin", detail: "iterator", kind: CompletionItem.KIND_FUNCTION, insertText: "begin()", sortKey: "b_begin" },
    { label: "end", detail: "iterator", kind: CompletionItem.KIND_FUNCTION, insertText: "end()", sortKey: "c_end" },
    { label: "push_back", detail: "void push_back(T)", kind: CompletionItem.KIND_FUNCTION, insertText: "push_back()", sortKey: "d_push_back" },
  ],
  java: [
    { label: "length", detail: "int", kind: CompletionItem.KIND_PROPERTY, insertText: "length", sortKey: "a_length" },
    { label: "substring", detail: "String substring(int, int)", kind: CompletionItem.KIND_FUNCTION, insertText: "substring()", sortKey: "b_substring" },
    { label: "toString", detail: "String", kind: CompletionItem.KIND_FUNCTION, insertText: "toString()", sortKey: "c_toString" },
    { label: "equals", detail: "boolean equals(Object)", kind: CompletionItem.KIND_FUNCTION, insertText: "equals()", sortKey: "d_equals" },
  ],
  kotlin: [
    { label: "length", detail: "Int", kind: CompletionItem.KIND_PROPERTY, insertText: "length", sortKey: "a_length" },
    { label: "contains", detail: "Boolean contains(CharSequence)", kind: CompletionItem.KIND_FUNCTION, insertText: "contains()", sortKey: "b_contains" },
    { label: "substring", detail: "String", kind: CompletionItem.KIND_FUNCTION, insertText: "substring()", sortKey: "c_substring" },
    { label: "toInt", detail: "Int", kind: CompletionItem.KIND_FUNCTION, insertText: "toInt()", sortKey: "d_toInt" },
  ],
  lua: [
    { label: "len", detail: "number", kind: CompletionItem.KIND_FUNCTION, insertText: "len()", sortKey: "a_len" },
    { label: "sub", detail: "string.sub", kind: CompletionItem.KIND_FUNCTION, insertText: "sub()", sortKey: "b_sub" },
    { label: "upper", detail: "string.upper", kind: CompletionItem.KIND_FUNCTION, insertText: "upper()", sortKey: "c_upper" },
    { label: "lower", detail: "string.lower", kind: CompletionItem.KIND_FUNCTION, insertText: "lower()", sortKey: "d_lower" },
  ],
});

const GLOBAL_COMPLETIONS: Readonly<Record<LanguageKind, IDemoCompletionItem[]>> = Object.freeze({
  cpp: [
    { label: "std::string", detail: "class", kind: CompletionItem.KIND_CLASS, insertText: "std::string", sortKey: "a_std_string" },
    { label: "std::vector", detail: "template class", kind: CompletionItem.KIND_CLASS, insertText: "std::vector<>", sortKey: "b_std_vector" },
    { label: "std::cout", detail: "ostream", kind: CompletionItem.KIND_VARIABLE, insertText: "std::cout", sortKey: "c_std_cout" },
    { label: "if", detail: "snippet", kind: CompletionItem.KIND_SNIPPET, insertText: "if (${1:condition}) {\n\t$0\n}", insertTextFormat: CompletionItem.INSERT_TEXT_FORMAT_SNIPPET, sortKey: "d_if" },
    { label: "for", detail: "snippet", kind: CompletionItem.KIND_SNIPPET, insertText: "for (int ${1:i} = 0; ${1:i} < ${2:n}; ++${1:i}) {\n\t$0\n}", insertTextFormat: CompletionItem.INSERT_TEXT_FORMAT_SNIPPET, sortKey: "e_for" },
    { label: "class", detail: "snippet", kind: CompletionItem.KIND_SNIPPET, insertText: "class ${1:ClassName} {\npublic:\n\t${1:ClassName}() {$2}\n\t~${1:ClassName}() {$3}\n$0\n};", insertTextFormat: CompletionItem.INSERT_TEXT_FORMAT_SNIPPET, sortKey: "f_class" },
  ],
  java: [
    { label: "String", detail: "class", kind: CompletionItem.KIND_CLASS, insertText: "String", sortKey: "a_string" },
    { label: "ArrayList", detail: "class", kind: CompletionItem.KIND_CLASS, insertText: "ArrayList<>", sortKey: "b_arraylist" },
    { label: "System.out.println", detail: "method", kind: CompletionItem.KIND_FUNCTION, insertText: "System.out.println($0);", insertTextFormat: CompletionItem.INSERT_TEXT_FORMAT_SNIPPET, sortKey: "c_println" },
    { label: "if", detail: "snippet", kind: CompletionItem.KIND_SNIPPET, insertText: "if (${1:condition}) {\n\t$0\n}", insertTextFormat: CompletionItem.INSERT_TEXT_FORMAT_SNIPPET, sortKey: "d_if" },
    { label: "for", detail: "snippet", kind: CompletionItem.KIND_SNIPPET, insertText: "for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t$0\n}", insertTextFormat: CompletionItem.INSERT_TEXT_FORMAT_SNIPPET, sortKey: "e_for" },
  ],
  kotlin: [
    { label: "println", detail: "function", kind: CompletionItem.KIND_FUNCTION, insertText: "println($0)", insertTextFormat: CompletionItem.INSERT_TEXT_FORMAT_SNIPPET, sortKey: "a_println" },
    { label: "mutableListOf", detail: "function", kind: CompletionItem.KIND_FUNCTION, insertText: "mutableListOf()", sortKey: "b_mutable_list" },
    { label: "when", detail: "keyword", kind: CompletionItem.KIND_KEYWORD, insertText: "when (${1:value}) {\n\t$0\n}", insertTextFormat: CompletionItem.INSERT_TEXT_FORMAT_SNIPPET, sortKey: "c_when" },
    { label: "data class", detail: "snippet", kind: CompletionItem.KIND_SNIPPET, insertText: "data class ${1:Name}(${2:val id: Int})", insertTextFormat: CompletionItem.INSERT_TEXT_FORMAT_SNIPPET, sortKey: "d_data_class" },
  ],
  lua: [
    { label: "print", detail: "function", kind: CompletionItem.KIND_FUNCTION, insertText: "print($0)", insertTextFormat: CompletionItem.INSERT_TEXT_FORMAT_SNIPPET, sortKey: "a_print" },
    { label: "pairs", detail: "function", kind: CompletionItem.KIND_FUNCTION, insertText: "pairs()", sortKey: "b_pairs" },
    { label: "ipairs", detail: "function", kind: CompletionItem.KIND_FUNCTION, insertText: "ipairs()", sortKey: "c_ipairs" },
    { label: "for", detail: "snippet", kind: CompletionItem.KIND_SNIPPET, insertText: "for ${1:i} = 1, ${2:n} do\n\t$0\nend", insertTextFormat: CompletionItem.INSERT_TEXT_FORMAT_SNIPPET, sortKey: "d_for" },
    { label: "function", detail: "snippet", kind: CompletionItem.KIND_SNIPPET, insertText: "function ${1:name}(${2:args})\n\t$0\nend", insertTextFormat: CompletionItem.INSERT_TEXT_FORMAT_SNIPPET, sortKey: "e_function" },
  ],
});

function toInt(value: unknown, fallback = 0): number {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.trunc(n);
}

function resolveLanguageKind(fileName: string): LanguageKind {
  const lower = String(fileName || "").toLowerCase();
  if (lower.endsWith(".java")) return "java";
  if (lower.endsWith(".kt")) return "kotlin";
  if (lower.endsWith(".lua")) return "lua";
  return "cpp";
}

function resolveLanguageConfiguration(fileName: string): { bracketPairs: Array<{ open: string; close: string; autoClose?: boolean; surround?: boolean }> } {
  const kind = resolveLanguageKind(fileName);
  if (kind === "lua") {
    return {
      bracketPairs: [
        { open: "(", close: ")" },
        { open: "[", close: "]" },
        { open: "{", close: "}" },
      ],
    };
  }

  return {
    bracketPairs: [
      { open: "(", close: ")" },
      { open: "[", close: "]" },
      { open: "{", close: "}" },
      { open: "\"", close: "\"", autoClose: false, surround: false },
      { open: "'", close: "'", autoClose: false, surround: false },
    ],
  };
}

function truncateDemoTextForWeb(text: string): { text: string; truncated: boolean } {
  return {
    text: normalizeNewlines(text),
    truncated: false,
  };
}

function parseColorLiteralArgb(literal: string): number | null {
  if (!literal || !/^0X[0-9A-Fa-f]{6,8}$/.test(literal)) {
    return null;
  }
  let hex = literal.slice(2);
  if (hex.length === 6) {
    hex = `FF${hex}`;
  }
  const value = Number.parseInt(hex, 16);
  if (!Number.isFinite(value)) {
    return null;
  }
  return value >>> 0;
}

function findLineCommentStart(line: string, marker: string): number {
  if (!marker || marker.length === 0) {
    return -1;
  }
  let quote = "";
  let escaped = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === quote) {
        quote = "";
      }
      continue;
    }

    if (ch === "'" || ch === "\"") {
      quote = ch;
      escaped = false;
      continue;
    }

    if (line.startsWith(marker, i)) {
      return i;
    }
  }
  return -1;
}

function buildDemoInlayAndDiagnostics(
  lines: string[],
  fileName: string,
  startLine: number,
  endLine: number,
  liteMode = false,
): { inlayHints: Map<number, unknown[]>; diagnostics: Map<number, unknown[]> } {
  const kind = resolveLanguageKind(fileName);

  const inlayHints = new Map<number, unknown[]>();
  const diagnostics = new Map<number, unknown[]>();

  for (let line = startLine; line <= endLine; line += 1) {
    const lineText = lines[line] ?? "";

    if (liteMode) {
      continue;
    }

    for (const colorMatch of lineText.matchAll(/\b0X[0-9A-Fa-f]{6,8}\b/g)) {
      const color = parseColorLiteralArgb(colorMatch[0]);
      if (color == null) {
        continue;
      }
      if (!inlayHints.has(line)) {
        inlayHints.set(line, []);
      }
      inlayHints.get(line)?.push({
        type: INLAY_COLOR_TYPE,
        column: (colorMatch.index ?? 0) + colorMatch[0].length + 1,
        color,
      });
    }

    const commentMarker = kind === "lua" ? "--" : "//";
    const commentPos = findLineCommentStart(lineText, commentMarker);
    if (commentPos >= 0) {
      const comment = lineText.slice(commentPos);
      const fixmePos = comment.toUpperCase().indexOf("FIXME");
      if (fixmePos >= 0) {
        if (!diagnostics.has(line)) diagnostics.set(line, []);
        diagnostics.get(line)?.push({
          column: commentPos + fixmePos,
          length: 5,
          severity: 0,
        });
      }

      const todoPos = comment.toUpperCase().indexOf("TODO");
      if (todoPos >= 0) {
        if (!diagnostics.has(line)) diagnostics.set(line, []);
        diagnostics.get(line)?.push({
          column: commentPos + todoPos,
          length: 4,
          severity: 1,
        });
      }
    }
  }

  return { inlayHints, diagnostics };
}

function registerSweetLineStyleMap(engine: any): void {
  engine.registerStyleName("keyword", STYLE.KEYWORD);
  engine.registerStyleName("type", STYLE.TYPE);
  engine.registerStyleName("string", STYLE.STRING);
  engine.registerStyleName("comment", STYLE.COMMENT);
  engine.registerStyleName("preprocessor", STYLE.PREPROCESSOR);
  engine.registerStyleName("macro", STYLE.PREPROCESSOR);
  engine.registerStyleName("method", STYLE.FUNCTION);
  engine.registerStyleName("function", STYLE.FUNCTION);
  engine.registerStyleName("variable", STYLE.VARIABLE);
  engine.registerStyleName("field", STYLE.VARIABLE);
  engine.registerStyleName("number", STYLE.NUMBER);
  engine.registerStyleName("class", STYLE.CLASS);
  engine.registerStyleName("builtin", STYLE.BUILTIN);
  engine.registerStyleName("annotation", STYLE.ANNOTATION);
  engine.registerStyleName("color", STYLE.COLOR);
  engine.registerStyleName("punctuation", STYLE.PUNCTUATION);
}

function buildDemoDecorationPatch(payload: Record<string, any> = {}): DecorationResult | null {
  const sourceLines = Array.isArray(payload.sourceLines) && payload.sourceLines.length > 0
    ? payload.sourceLines
    : [""];
  const fileName = String(payload.fileName || "example.kt");
  const visibleStart = Math.max(0, toInt(payload.visibleRange?.start, 0));
  const visibleEnd = Math.max(visibleStart - 1, toInt(payload.visibleRange?.end, visibleStart - 1));
  if (visibleEnd < visibleStart) {
    return null;
  }

  const liteMode = sourceLines.length > 1200;
  const rendered = buildDemoInlayAndDiagnostics(
    sourceLines,
    fileName,
    visibleStart,
    visibleEnd,
    liteMode,
  );

  if (liteMode) {
    return new DecorationResult({
      inlayHints: rendered.inlayHints,
      inlayHintsMode: DecorationApplyMode.REPLACE_RANGE,
      diagnostics: new Map(),
      diagnosticsMode: DecorationApplyMode.REPLACE_RANGE,
    });
  }

  const receiver = payload.receiver as { isCancelled?: boolean; accept?: (r: DecorationResult) => void } | undefined;
  setTimeout(() => {
    if (!receiver || receiver.isCancelled || typeof receiver.accept !== "function") {
      return;
    }
    receiver.accept(new DecorationResult({
      diagnostics: rendered.diagnostics,
      diagnosticsMode: DecorationApplyMode.REPLACE_RANGE,
    }));
  }, 90);

  return new DecorationResult({
    inlayHints: rendered.inlayHints,
    inlayHintsMode: DecorationApplyMode.REPLACE_RANGE,
  });
}

class DemoCompletionProvider {
  private readonly _getFileName: () => string;

  constructor(getFileName: () => string) {
    this._getFileName = getFileName;
  }

  isTriggerCharacter(ch: string): boolean {
    return ch === "." || ch === ":";
  }

  provideCompletions(context: Record<string, any>, receiver: { isCancelled?: boolean; accept: (result: CompletionResult) => void }): void {
    const fileName = context?.editorMetadata?.fileName || this._getFileName();
    const kind = resolveLanguageKind(fileName);

    if (context?.triggerKind === 1 && context?.triggerCharacter === ".") {
      const items = MEMBER_COMPLETIONS[kind] || MEMBER_COMPLETIONS.cpp;
      receiver.accept(new CompletionResult(items as never[], false));
      return;
    }

    const items = GLOBAL_COMPLETIONS[kind] || GLOBAL_COMPLETIONS.cpp;
    setTimeout(() => {
      if (receiver.isCancelled) {
        return;
      }
      receiver.accept(new CompletionResult(items as never[], false));
    }, 200);
  }
}

async function loadDemoFiles(runtimeBase: URL, versionTag: string): Promise<{ fileNames: string[]; fileMap: Map<string, string>; fileState: Map<string, { truncated: boolean }> }> {
  const fileNames = Object.keys(DEMO_FILE_FALLBACKS).slice().sort((a, b) => a.localeCompare(b));
  const fileMap = new Map<string, string>();
  const fileState = new Map<string, { truncated: boolean }>();

  await Promise.all(fileNames.map(async (fileName) => {
    const fallback = DEMO_FILE_FALLBACKS[fileName as keyof typeof DEMO_FILE_FALLBACKS];
    const url = new URL(`files/${encodeURIComponent(fileName)}?v=${versionTag}`, runtimeBase);
    try {
      const response = await fetch(url.href, { cache: "no-store" });
      if (!response.ok) {
        const fallbackResult = truncateDemoTextForWeb(fallback);
        fileMap.set(fileName, fallbackResult.text);
        fileState.set(fileName, { truncated: fallbackResult.truncated });
        return;
      }
      const loaded = truncateDemoTextForWeb(await response.text());
      fileMap.set(fileName, loaded.text);
      fileState.set(fileName, { truncated: loaded.truncated });
    } catch {
      const fallbackResult = truncateDemoTextForWeb(fallback);
      fileMap.set(fileName, fallbackResult.text);
      fileState.set(fileName, { truncated: fallbackResult.truncated });
    }
  }));

  return { fileNames, fileMap, fileState };
}

function registerDemoStyles(widget: IWidgetLike): void {
  widget.registerTextStyle(STYLE.KEYWORD, 0xFF7AA2F7, 0, 1);
  widget.registerTextStyle(STYLE.TYPE, 0xFF4EC9B0, 0, 0);
  widget.registerTextStyle(STYLE.STRING, 0xFFCE9178, 0, 0);
  widget.registerTextStyle(STYLE.COMMENT, 0xFF6A9955, 0, 2);
  widget.registerTextStyle(STYLE.BUILTIN, 0xFF7DCFFF, 0, 0);
  widget.registerTextStyle(STYLE.NUMBER, 0xFFB5CEA8, 0, 0);
  widget.registerTextStyle(STYLE.CLASS, 0xFFE0AF68, 0, 1);
  widget.registerTextStyle(STYLE.FUNCTION, 0xFF73DACA, 0, 0);
  widget.registerTextStyle(STYLE.VARIABLE, 0xFFD7DEE9, 0, 0);
  widget.registerTextStyle(STYLE.ANNOTATION, 0xFF4FC1FF, 0, 0);
  widget.registerTextStyle(STYLE.PUNCTUATION, 0xFFD4D4D4, 0, 0);
  widget.registerTextStyle(STYLE.PREPROCESSOR, 0xFFF7768E, 0, 0);
  widget.registerTextStyle(STYLE.COLOR, 0xFFFF9E64, 0, 1);
}

function resolveDecorationRuntimeOptionsByLineCount(lineCount: number): { scrollRefreshMinIntervalMs: number; overscanViewportMultiplier: number } {
  const total = Math.max(0, toInt(lineCount, 0));
  if (total >= 80000) {
    return { scrollRefreshMinIntervalMs: 140, overscanViewportMultiplier: 0.10 };
  }
  if (total >= 30000) {
    return { scrollRefreshMinIntervalMs: 110, overscanViewportMultiplier: 0.16 };
  }
  if (total >= 10000) {
    return { scrollRefreshMinIntervalMs: 85, overscanViewportMultiplier: 0.24 };
  }
  if (total >= 3000) {
    return { scrollRefreshMinIntervalMs: 65, overscanViewportMultiplier: 0.34 };
  }
  return { scrollRefreshMinIntervalMs: 50, overscanViewportMultiplier: 0.5 };
}

async function ensureSweetLineRuntime(runtimeBase: URL, versionTag: string): Promise<{ sweetLine: any; engine: any }> {
  const moduleUrl = new URL(`libs/sweetline/libsweetline.js?v=${versionTag}`, runtimeBase);
  const mod = await import(/* @vite-ignore */ moduleUrl.href);
  const loader = (mod.default ?? mod) as SweetLineModuleLoader;
  const sweetLine = await loader({
    locateFile: (path: string) => {
      if (String(path).endsWith(".wasm")) {
        return new URL(`libs/sweetline/${path}?v=${versionTag}`, runtimeBase).href;
      }
      return new URL(`libs/sweetline/${path}`, runtimeBase).href;
    },
  });

  const config = new sweetLine.HighlightConfig();
  config.showIndex = false;
  config.inlineStyle = false;
  config.tabSize = 4;

  const engine = new sweetLine.HighlightEngine(config);
  registerSweetLineStyleMap(engine);

  for (const syntaxFile of SYNTAX_JSON_FILES) {
    const syntaxUrl = new URL(`syntaxes/${syntaxFile}?v=${versionTag}`, runtimeBase);
    try {
      const response = await fetch(syntaxUrl.href, { cache: "no-store" });
      if (!response.ok) {
        console.warn(`SweetLine syntax load failed: ${syntaxFile}`);
        continue;
      }
      engine.compileSyntaxFromJson(await response.text());
    } catch {
      console.warn(`SweetLine syntax load failed: ${syntaxFile}`);
    }
  }
  return { sweetLine, engine };
}

function setStatus(message: string): void {
  const statusText = document.getElementById("statusText");
  if (statusText) {
    statusText.textContent = message;
  }
}

function appendCodeLensLog(logHost: HTMLElement | null, message: string): void {
  if (!logHost) {
    return;
  }
  const stamp = new Date().toLocaleTimeString();
  const line = `[${stamp}] ${message}`;
  const existing = (logHost.textContent || "")
    .split("\n")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0 && entry !== "CodeLens event log ready.");
  const output = existing.concat(line).slice(-48);
  logHost.textContent = output.join("\n");
  logHost.scrollTop = logHost.scrollHeight;
}

function normalizeCodeLensTargetLines(candidates: number[], lineCount: number, maxCount = 4): number[] {
  const normalized: number[] = [];
  const seen = new Set<number>();
  candidates.forEach((line) => {
    const value = toInt(line, -1);
    if (value < 0 || value >= lineCount || seen.has(value)) {
      return;
    }
    seen.add(value);
    normalized.push(value);
  });
  if (normalized.length >= maxCount) {
    return normalized.slice(0, maxCount);
  }
  for (let i = 0; i < lineCount && normalized.length < maxCount; i += 1) {
    if (seen.has(i)) {
      continue;
    }
    normalized.push(i);
    seen.add(i);
  }
  return normalized.slice(0, maxCount);
}

function selectCodeLensTargetLines(text: string, fileName: string, maxCount = 4): number[] {
  const lines = normalizeNewlines(text).split("\n");
  const lineCount = Math.max(0, lines.length);
  if (lineCount === 0) {
    return [];
  }

  const selected: number[] = [];
  if (fileName === CODELENS_DEMO_FILE) {
    ["main(", "run(", "log(", "sum("].forEach((token) => {
      const hit = lines.findIndex((line) => line.includes(token));
      if (hit >= 0) {
        selected.push(hit);
      }
    });
  }

  const functionPattern = /^\s*(?:public|protected|private|static|inline|virtual|constexpr|final|friend|internal|open|override|suspend|const|[\w:<>\[\]&*]+\s+)+[A-Za-z_~$][\w$]*\s*\([^;]*\)\s*\{/;
  const kotlinPattern = /^\s*(?:public|private|protected|internal|open|override|suspend|inline|tailrec|operator|infix|external|expect|actual|\s)*fun\s+[A-Za-z_][\w$]*\s*\(/;
  const luaPattern = /^\s*function\s+[A-Za-z_][\w.:]*\s*\(/;

  lines.forEach((rawLine, lineNo) => {
    const line = String(rawLine || "");
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      return;
    }
    if (
      trimmed.startsWith("import ")
      || trimmed.startsWith("package ")
      || trimmed.startsWith("//")
      || trimmed.startsWith("--")
      || trimmed.startsWith("#")
      || trimmed.startsWith("class ")
      || trimmed.startsWith("interface ")
      || trimmed.startsWith("object ")
      || trimmed.startsWith("if ")
      || trimmed.startsWith("for ")
      || trimmed.startsWith("while ")
      || trimmed.startsWith("switch ")
      || trimmed.startsWith("catch ")
    ) {
      return;
    }
    if (functionPattern.test(line) || kotlinPattern.test(line) || luaPattern.test(line)) {
      selected.push(lineNo);
    }
  });

  if (selected.length === 0) {
    lines.forEach((rawLine, lineNo) => {
      const trimmed = String(rawLine || "").trim();
      if (trimmed.length > 0 && !trimmed.startsWith("import ") && !trimmed.startsWith("package ")) {
        selected.push(lineNo);
      }
    });
  }

  return normalizeCodeLensTargetLines(selected, lineCount, maxCount);
}

function collectWordRanges(lineText: string): Array<{ column: number; length: number; token: string }> {
  const ranges: Array<{ column: number; length: number; token: string }> = [];
  const regex = /\b[A-Za-z_][A-Za-z0-9_$]*\b/g;
  for (const match of lineText.matchAll(regex)) {
    const token = String(match[0] ?? "");
    if (!token) {
      continue;
    }
    const column = toInt(match.index, -1);
    if (column < 0) {
      continue;
    }
    ranges.push({ column, length: token.length, token });
  }
  return ranges;
}

function collectFallbackRange(lineText: string): { column: number; length: number; token: string } | null {
  const firstSegment = /\S+/.exec(lineText);
  if (!firstSegment || !firstSegment[0]) {
    return null;
  }
  const column = toInt(firstSegment.index, -1);
  if (column < 0) {
    return null;
  }
  return {
    column,
    length: firstSegment[0].length,
    token: firstSegment[0],
  };
}

function buildCodeLensItemsForLine(line: number, lineText: string, variant: "line" | "batch"): DemoCodeLensItem[] {
  const lineNo = Math.max(0, toInt(line, 0));
  const base = lineNo + 1;
  const ranges = collectWordRanges(lineText);
  const firstColumn = ranges[0]?.column ?? 0;
  // Keep Run/Debug in the same anchor column so only "|" controls visual spacing.
  const secondColumn = firstColumn;
  if (variant === "batch") {
    return [
      { column: firstColumn, text: "Run", commandId: 3000 + base },
      { column: secondColumn, text: "Debug", commandId: 4000 + base },
    ];
  }
  return [
    { column: firstColumn, text: "Run", commandId: 1000 + base },
    { column: secondColumn, text: "Debug", commandId: 2000 + base },
  ];
}

function buildLinkSpansForLine(line: number, lineText: string, fileName: string, variant: "line" | "batch"): DemoLinkSpan[] {
  const lineNo = Math.max(0, toInt(line, 0));
  const ranges = collectWordRanges(lineText);
  if (ranges.length === 0) {
    const fallback = collectFallbackRange(lineText);
    if (!fallback) {
      return [];
    }
    ranges.push(fallback);
  }

  const makeTarget = (token: string, slot: number): string => {
    const encodedFile = encodeURIComponent(fileName);
    const encodedToken = encodeURIComponent(token);
    return `demo://${encodedFile}/L${lineNo + 1}?token=${encodedToken}&variant=${variant}&slot=${slot}`;
  };

  const first = ranges[0];
  if (!first) {
    return [];
  }

  if (variant === "line") {
    return [{
      column: first.column,
      length: first.length,
      target: makeTarget(first.token, 1),
    }];
  }

  const spans: DemoLinkSpan[] = [];
  spans.push({
    column: first.column,
    length: first.length,
    target: makeTarget(first.token, 1),
  });
  const last = ranges[ranges.length - 1];
  if (last && (last.column !== first.column || last.length !== first.length)) {
    spans.push({
      column: last.column,
      length: last.length,
      target: makeTarget(last.token, 2),
    });
  }
  return spans;
}

async function bootstrap(): Promise<void> {
  const host = document.getElementById("editor") as HTMLElement | null;
  const fileSelect = document.getElementById("fileSelect") as HTMLSelectElement | null;
  const openLocalBtn = document.getElementById("openLocalBtn") as HTMLButtonElement | null;
  const localFileInput = document.getElementById("localFileInput") as HTMLInputElement | null;
  const undoBtn = document.getElementById("undoBtn") as HTMLButtonElement | null;
  const redoBtn = document.getElementById("redoBtn") as HTMLButtonElement | null;
  const completeBtn = document.getElementById("completeBtn") as HTMLButtonElement | null;
  const applyCodeLensBtn = document.getElementById("applyCodeLensBtn") as HTMLButtonElement | null;
  const applyBatchCodeLensBtn = document.getElementById("applyBatchCodeLensBtn") as HTMLButtonElement | null;
  const clearCodeLensBtn = document.getElementById("clearCodeLensBtn") as HTMLButtonElement | null;
  const applyLineLinksBtn = document.getElementById("applyLineLinksBtn") as HTMLButtonElement | null;
  const applyBatchLinksBtn = document.getElementById("applyBatchLinksBtn") as HTMLButtonElement | null;
  const clearLinksBtn = document.getElementById("clearLinksBtn") as HTMLButtonElement | null;
  const imeScenarioSelect = document.getElementById("imeScenarioSelect") as HTMLSelectElement | null;
  const codeLensLog = document.getElementById("codeLensLog") as HTMLElement | null;

  if (
    !host
    || !fileSelect
    || !openLocalBtn
    || !localFileInput
    || !undoBtn
    || !redoBtn
    || !completeBtn
    || !applyCodeLensBtn
    || !applyBatchCodeLensBtn
    || !clearCodeLensBtn
    || !applyLineLinksBtn
    || !applyBatchLinksBtn
    || !clearLinksBtn
    || !imeScenarioSelect
  ) {
    throw new Error("Demo DOM missing required elements");
  }
  const fileSelectEl = fileSelect;
  const openLocalBtnEl = openLocalBtn;
  const localFileInputEl = localFileInput;
  const undoBtnEl = undoBtn;
  const redoBtnEl = redoBtn;
  const completeBtnEl = completeBtn;
  const applyCodeLensBtnEl = applyCodeLensBtn;
  const applyBatchCodeLensBtnEl = applyBatchCodeLensBtn;
  const clearCodeLensBtnEl = clearCodeLensBtn;
  const applyLineLinksBtnEl = applyLineLinksBtn;
  const applyBatchLinksBtnEl = applyBatchLinksBtn;
  const clearLinksBtnEl = clearLinksBtn;
  const imeScenarioSelectEl = imeScenarioSelect;
  const codeLensLogEl = codeLensLog;

  const wasmVersion = String(Date.now());
  const locale = (navigator.language || "").toLowerCase().startsWith("zh") ? "zh-CN" : "en";
  const runtimeBase = new URL("./runtime/", window.location.href);

  const DEMO_DECORATION_OPTIONS = Object.freeze({
    textChangeMode: DecorationTextChangeMode.INCREMENTAL,
    resultDispatchMode: DecorationResultDispatchMode.BOTH,
    providerCallMode: DecorationProviderCallMode.SYNC,
    applySynchronously: false,
  });

  const { fileNames, fileMap, fileState } = await loadDemoFiles(runtimeBase, wasmVersion);
  const initialFileName = fileNames[0] || "example.kt";
  const initialText = fileMap.get(initialFileName) || DEMO_FILE_FALLBACKS[initialFileName as keyof typeof DEMO_FILE_FALLBACKS] || "";
  const initialDecorationRuntimeOptions = resolveDecorationRuntimeOptionsByLineCount(countLogicalLines(initialText));

  const editor = await createEditor(host, {
    model: createModel(initialText, {
      uri: `inmemory://demo/${initialFileName}`,
      language: resolveLanguageKind(initialFileName),
    }),
    locale,
    performanceOverlay: {
      enabled: true,
      visible: true,
      stutterThresholdMs: 50,
      chart: {
        enabled: true,
      },
    },
    decorationOptions: {
      ...DEMO_DECORATION_OPTIONS,
      ...initialDecorationRuntimeOptions,
    },
    widgetOptions: {
      editorOptions: {
        fontFamily: DEMO_EDITOR_FONT_FAMILY,
        typeface: DEMO_EDITOR_FONT_FAMILY,
      },
    },
  });

  const widget = editor.getNativeWidget() as IWidgetLike;
  widget.setPerformanceOverlayEnabled?.(true);
  widget.setPerformanceOverlayVisible?.(true);

  registerDemoStyles(widget);
  widget.setContentStartPadding?.(5);

  setStatus("Loading SweetLine runtime...");
  const sweetLineRuntime = await ensureSweetLineRuntime(runtimeBase, wasmVersion);

  let activeFileName = initialFileName;
  const demoDecorationProvider = widget.addSweetLineDecorationProvider?.({
    sweetLine: sweetLineRuntime.sweetLine,
    highlightEngine: sweetLineRuntime.engine,
    fileName: initialFileName,
    text: initialText,
    maxRenderLinesPerPass: MAX_RENDER_LINES_PER_PASS,
    syntaxSpansMode: DecorationApplyMode.MERGE,
    syncSourceOnTextChange: true,
    decorate: buildDemoDecorationPatch,
  });

  const demoCompletionProvider = new DemoCompletionProvider(() => activeFileName);
  widget.addCompletionProvider?.(demoCompletionProvider);

  const readEditorText = (): string => String(widget.getText?.() ?? editor.getValue() ?? "");

  const applyLineCodeLensDemo = (): void => {
    if (typeof widget.setLineCodeLens !== "function") {
      appendCodeLensLog(codeLensLogEl, "setLineCodeLens is unavailable in this runtime.");
      setStatus("CodeLens API unavailable");
      return;
    }
    const text = readEditorText();
    const targets = selectCodeLensTargetLines(text, activeFileName, 3);
    if (targets.length === 0) {
      appendCodeLensLog(codeLensLogEl, "No target line found for CodeLens.");
      setStatus("CodeLens: no target line");
      return;
    }
    widget.clearCodeLens?.();
    const lines = normalizeNewlines(text).split("\n");
    targets.forEach((line) => {
      widget.setLineCodeLens?.(line, buildCodeLensItemsForLine(line, lines[line] ?? "", "line"));
    });
    widget.requestDecorationRefresh?.();
    const humanLines = targets.map((line) => line + 1).join(", ");
    appendCodeLensLog(codeLensLogEl, `Applied line API CodeLens on lines: ${humanLines}.`);
    setStatus(`CodeLens(line): ${targets.length} line(s)`);
  };

  const applyBatchCodeLensDemo = (): void => {
    if (typeof widget.setBatchLineCodeLens !== "function") {
      appendCodeLensLog(codeLensLogEl, "setBatchLineCodeLens is unavailable in this runtime.");
      setStatus("CodeLens API unavailable");
      return;
    }
    const text = readEditorText();
    const targets = selectCodeLensTargetLines(text, activeFileName, 4);
    if (targets.length === 0) {
      appendCodeLensLog(codeLensLogEl, "No target line found for batch CodeLens.");
      setStatus("CodeLens: no target line");
      return;
    }
    const payload: Record<number, DemoCodeLensItem[]> = {};
    const lines = normalizeNewlines(text).split("\n");
    targets.forEach((line) => {
      payload[line] = buildCodeLensItemsForLine(line, lines[line] ?? "", "batch");
    });
    widget.clearCodeLens?.();
    widget.setBatchLineCodeLens?.(payload);
    widget.requestDecorationRefresh?.();
    const humanLines = targets.map((line) => line + 1).join(", ");
    appendCodeLensLog(codeLensLogEl, `Applied batch API CodeLens on lines: ${humanLines}.`);
    setStatus(`CodeLens(batch): ${targets.length} line(s)`);
  };

  const clearCodeLensDemo = (): void => {
    widget.clearCodeLens?.();
    widget.requestDecorationRefresh?.();
    appendCodeLensLog(codeLensLogEl, "Cleared all CodeLens items.");
    setStatus("CodeLens cleared");
  };

  const applyLineLinksDemo = (): void => {
    if (typeof widget.setLineLinks !== "function") {
      appendCodeLensLog(codeLensLogEl, "setLineLinks is unavailable in this runtime.");
      setStatus("Links API unavailable");
      return;
    }
    const text = readEditorText();
    const lines = normalizeNewlines(text).split("\n");
    const targets = selectCodeLensTargetLines(text, activeFileName, 3);
    if (targets.length === 0) {
      appendCodeLensLog(codeLensLogEl, "No target line found for line links.");
      setStatus("Links: no target line");
      return;
    }
    widget.clearLinks?.();
    let applied = 0;
    let firstProbe: { line: number; column: number; expected: string } | null = null;
    for (const line of targets) {
      const spans = buildLinkSpansForLine(line, lines[line] ?? "", activeFileName, "line");
      if (spans.length > 0) {
        widget.setLineLinks?.(line, spans);
        if (!firstProbe) {
          const firstSpan = spans[0];
          if (firstSpan) {
            firstProbe = {
              line,
              column: toInt(firstSpan.column, 0),
              expected: String(firstSpan.target ?? ""),
            };
          }
        }
        applied += 1;
      }
    }
    if (applied <= 0) {
      appendCodeLensLog(codeLensLogEl, "Line links produced 0 spans. Current file may have no suitable token text.");
      setStatus("Links(line): 0 line(s)");
      return;
    }
    widget.requestDecorationRefresh?.();
    if (firstProbe && typeof widget.getLinkTargetAt === "function") {
      const resolved = String(widget.getLinkTargetAt(firstProbe.line, firstProbe.column) ?? "");
      const lineLabel = firstProbe.line + 1;
      if (resolved) {
        appendCodeLensLog(codeLensLogEl, `Link probe ok at L${lineLabel}:C${firstProbe.column}, target=${resolved}.`);
      } else {
        appendCodeLensLog(codeLensLogEl, `Link probe empty at L${lineLabel}:C${firstProbe.column}. expected=${firstProbe.expected}.`);
      }
    }
    appendCodeLensLog(codeLensLogEl, `Applied line API links on ${applied} line(s). Hover text to verify pointer cursor + click.`);
    setStatus(`Links(line): ${applied} line(s)`);
  };

  const applyBatchLinksDemo = (): void => {
    if (typeof widget.setBatchLineLinks !== "function") {
      appendCodeLensLog(codeLensLogEl, "setBatchLineLinks is unavailable in this runtime.");
      setStatus("Links API unavailable");
      return;
    }
    const text = readEditorText();
    const lines = normalizeNewlines(text).split("\n");
    const targets = selectCodeLensTargetLines(text, activeFileName, 4);
    if (targets.length === 0) {
      appendCodeLensLog(codeLensLogEl, "No target line found for batch links.");
      setStatus("Links: no target line");
      return;
    }
    const payload: Record<number, DemoLinkSpan[]> = {};
    let firstProbe: { line: number; column: number; expected: string } | null = null;
    for (const line of targets) {
      const spans = buildLinkSpansForLine(line, lines[line] ?? "", activeFileName, "batch");
      if (spans.length > 0) {
        payload[line] = spans;
        if (!firstProbe) {
          const firstSpan = spans[0];
          if (firstSpan) {
            firstProbe = {
              line,
              column: toInt(firstSpan.column, 0),
              expected: String(firstSpan.target ?? ""),
            };
          }
        }
      }
    }
    if (Object.keys(payload).length <= 0) {
      appendCodeLensLog(codeLensLogEl, "Batch links produced 0 spans. Current file may have no suitable token text.");
      setStatus("Links(batch): 0 line(s)");
      return;
    }
    widget.clearLinks?.();
    widget.setBatchLineLinks?.(payload);
    widget.requestDecorationRefresh?.();
    if (firstProbe && typeof widget.getLinkTargetAt === "function") {
      const resolved = String(widget.getLinkTargetAt(firstProbe.line, firstProbe.column) ?? "");
      const lineLabel = firstProbe.line + 1;
      if (resolved) {
        appendCodeLensLog(codeLensLogEl, `Batch link probe ok at L${lineLabel}:C${firstProbe.column}, target=${resolved}.`);
      } else {
        appendCodeLensLog(codeLensLogEl, `Batch link probe empty at L${lineLabel}:C${firstProbe.column}. expected=${firstProbe.expected}.`);
      }
    }
    appendCodeLensLog(codeLensLogEl, `Applied batch API links on ${Object.keys(payload).length} line(s). Hover text to verify pointer cursor + click.`);
    setStatus(`Links(batch): ${Object.keys(payload).length} line(s)`);
  };

  const clearLinksDemo = (): void => {
    widget.clearLinks?.();
    widget.requestDecorationRefresh?.();
    appendCodeLensLog(codeLensLogEl, "Cleared all link spans.");
    setStatus("Links cleared");
  };

  const applyCompositionImeScenario = (compositionEnabled: boolean, imeCandidateOpen: boolean): void => {
    const label = `editor compositionEnabled=${compositionEnabled},ime候选${imeCandidateOpen ? "打开" : "关闭"}`;

    if (typeof widget.setCompositionEnabled === "function") {
      widget.setCompositionEnabled(compositionEnabled);
    } else {
      appendCodeLensLog(codeLensLogEl, `setCompositionEnabled is unavailable, ${label}.`);
      setStatus(`IME scenario partial: ${label}`);
      return;
    }

    if (imeCandidateOpen) {
      if (typeof widget.openImeCandidate === "function") {
        widget.openImeCandidate();
      } else {
        appendCodeLensLog(codeLensLogEl, `openImeCandidate is unavailable, ${label}.`);
      }
    } else if (typeof widget.closeImeCandidate === "function") {
      widget.closeImeCandidate();
    } else {
      appendCodeLensLog(codeLensLogEl, `closeImeCandidate is unavailable, ${label}.`);
    }

    appendCodeLensLog(codeLensLogEl, `Applied ${label}.`);
    setStatus(`IME scenario: ${label}`);
  };

  const IME_SCENARIO_PRESETS = Object.freeze({
    compOnImeOff: { compositionEnabled: true, imeCandidateOpen: false },
    compOnImeOn: { compositionEnabled: true, imeCandidateOpen: true },
    compOffImeOff: { compositionEnabled: false, imeCandidateOpen: false },
    compOffImeOn: { compositionEnabled: false, imeCandidateOpen: true },
  });

  const applySelectedImeScenario = (): void => {
    const key = String(imeScenarioSelectEl.value || "compOnImeOff");
    const scenario = (IME_SCENARIO_PRESETS as Record<string, { compositionEnabled: boolean; imeCandidateOpen: boolean }>)[key]
      || IME_SCENARIO_PRESETS.compOnImeOff;
    applyCompositionImeScenario(scenario.compositionEnabled, scenario.imeCandidateOpen);
  };

  const onCodeLensClick = (event: any): void => {
    const line = toInt(event?.line ?? event?.payload?.line, -1);
    const column = toInt(event?.column ?? event?.payload?.column, -1);
    const commandId = toInt(
      event?.commandId
      ?? event?.command_id
      ?? event?.iconId
      ?? event?.icon_id
      ?? event?.payload?.commandId
      ?? event?.payload?.command_id
      ?? event?.payload?.iconId
      ?? event?.payload?.icon_id,
      -1,
    );
    const lineLabel = line >= 0 ? String(line + 1) : "?";
    const columnLabel = column >= 0 ? String(column) : "?";
    const commandLabel = commandId >= 0 ? String(commandId) : "?";
    appendCodeLensLog(codeLensLogEl, `CodeLens clicked at line ${lineLabel}, column=${columnLabel}, commandId=${commandLabel}.`);
    setStatus(`CodeLens click: L${lineLabel}:C${columnLabel}, cmd ${commandLabel}`);
  };

  const onLinkClick = (event: any): void => {
    const line = toInt(event?.line ?? event?.payload?.line, -1);
    const column = toInt(event?.column ?? event?.payload?.column, -1);
    const target = String(event?.target ?? event?.payload?.target ?? "");
    const resolved = (line >= 0 && column >= 0 && typeof widget.getLinkTargetAt === "function")
      ? String(widget.getLinkTargetAt(line, column) ?? "")
      : "";
    const lineLabel = line >= 0 ? String(line + 1) : "?";
    const columnLabel = column >= 0 ? String(column) : "?";
    appendCodeLensLog(
      codeLensLogEl,
      `Link clicked at L${lineLabel}:C${columnLabel}, target=${target || "(empty)"}${resolved && resolved !== target ? `, resolved=${resolved}` : ""}.`,
    );
    setStatus(`Link click: L${lineLabel}:C${columnLabel}`);
  };

  if (typeof widget.subscribe === "function") {
    widget.subscribe(CODELENS_EVENT_STANDARD, onCodeLensClick);
    widget.subscribe(CODELENS_EVENT_LEGACY, onCodeLensClick);
    widget.subscribe(LINK_EVENT_STANDARD, onLinkClick);
    widget.subscribe(LINK_EVENT_LEGACY, onLinkClick);
    appendCodeLensLog(codeLensLogEl, "Listening for CodeLens/Link click events.");
  } else {
    appendCodeLensLog(codeLensLogEl, "Widget event subscribe is unavailable; click callback test disabled.");
  }

  function ensureFileOption(fileName: string): void {
    for (let i = 0; i < fileSelectEl.options.length; i += 1) {
      const existing = fileSelectEl.options.item(i);
      if (existing && existing.value === fileName) {
        return;
      }
    }

    const option = document.createElement("option");
    option.value = fileName;
    option.textContent = fileName;
    fileSelectEl.appendChild(option);
  }

  function getUniqueLocalFileName(fileName: string): string {
    const raw = String(fileName || "").trim();
    const base = raw.length > 0 ? raw : `local-${Date.now()}.txt`;
    if (!fileMap.has(base)) {
      return base;
    }

    const dot = base.lastIndexOf(".");
    const hasExt = dot > 0 && dot < base.length - 1;
    const stem = hasExt ? base.slice(0, dot) : base;
    const ext = hasExt ? base.slice(dot) : "";

    let index = 2;
    while (true) {
      const candidate = `${stem} (${index})${ext}`;
      if (!fileMap.has(candidate)) {
        return candidate;
      }
      index += 1;
    }
  }

  function snapshotActiveFileContent(): void {
    if (!activeFileName) {
      return;
    }
    try {
      const currentText = String(widget.getText?.() ?? editor.getValue());
      fileMap.set(activeFileName, currentText);
      fileState.set(activeFileName, { truncated: false });
    } catch (error) {
      console.warn("Snapshot active file failed:", error);
    }
  }

  function loadFile(fileName: string): void {
    const normalizedFileName = String(fileName || "");
    if (!normalizedFileName) {
      setStatus("Load failed: empty file name");
      return;
    }

    if (activeFileName && activeFileName !== normalizedFileName) {
      snapshotActiveFileContent();
    }

    const knownFile = fileMap.has(normalizedFileName)
      || Object.prototype.hasOwnProperty.call(DEMO_FILE_FALLBACKS, normalizedFileName);
    if (!knownFile) {
      setStatus(`Load failed: ${normalizedFileName} not found`);
      return;
    }

    const text = fileMap.has(normalizedFileName)
      ? (fileMap.get(normalizedFileName) ?? "")
      : (DEMO_FILE_FALLBACKS[normalizedFileName as keyof typeof DEMO_FILE_FALLBACKS] || "");

    try {
      activeFileName = normalizedFileName;
      widget.clearAllDecorations?.();
      demoDecorationProvider?.setDocumentSource?.(normalizedFileName, text);
      widget.setDecorationProviderOptions?.(
        resolveDecorationRuntimeOptionsByLineCount(demoDecorationProvider?.getLineCount?.() ?? countLogicalLines(text)),
      );
      widget.setMetadata?.({ fileName: normalizedFileName });
      widget.setLanguageConfiguration?.(resolveLanguageConfiguration(normalizedFileName));

      editor.setModel(createModel(text, {
        uri: `inmemory://demo/${normalizedFileName}`,
        language: resolveLanguageKind(normalizedFileName),
      }));
      widget.setScroll?.(0, 0);
      widget.requestDecorationRefresh?.();
      setStatus(`Loaded: ${normalizedFileName}`);
      if (normalizedFileName === CODELENS_DEMO_FILE) {
        appendCodeLensLog(codeLensLogEl, "Loaded CodeLens demo file. Use CodeLens/Links buttons to test click events and pointer cursor.");
      }
    } catch (error) {
      console.error("Failed to load file:", normalizedFileName, error);
      setStatus(`Load failed: ${normalizedFileName}`);
    }
  }

  function applyFileContent(fileName: string, text: string, options: { truncated?: boolean } = {}): void {
    const { truncated = false } = options;
    fileMap.set(fileName, text);
    fileState.set(fileName, { truncated: !!truncated });
    ensureFileOption(fileName);
    fileSelectEl.value = fileName;
    loadFile(fileName);
  }

  for (const fileName of fileNames) {
    const option = document.createElement("option");
    option.value = fileName;
    option.textContent = fileName;
    fileSelectEl.appendChild(option);
  }

  fileSelectEl.value = initialFileName;
  loadFile(initialFileName);

  const onFileSelectChanged = (): void => {
    loadFile(fileSelectEl.value);
  };

  fileSelectEl.addEventListener("change", onFileSelectChanged);
  fileSelectEl.addEventListener("input", onFileSelectChanged);

  openLocalBtnEl.addEventListener("click", () => {
    localFileInputEl.click();
  });

  localFileInputEl.addEventListener("change", async () => {
    const localFile = localFileInputEl.files && localFileInputEl.files[0];
    if (!localFile) {
      return;
    }

    try {
      setStatus(`Loading local: ${localFile.name}...`);
      const rawText = await localFile.text();
      const truncated = truncateDemoTextForWeb(rawText);
      const fileName = getUniqueLocalFileName(localFile.name || "local.txt");
      applyFileContent(fileName, truncated.text, { truncated: truncated.truncated });
      setStatus(`Loaded local: ${fileName}`);
    } catch (error) {
      console.error("Failed to load local file:", error);
      setStatus("Load local failed");
    } finally {
      localFileInputEl.value = "";
    }
  });

  undoBtnEl.addEventListener("click", () => {
    widget.undo?.();
  });

  redoBtnEl.addEventListener("click", () => {
    widget.redo?.();
  });

  completeBtnEl.addEventListener("click", () => {
    widget.triggerCompletion?.();
  });

  applyCodeLensBtnEl.addEventListener("click", () => {
    applyLineCodeLensDemo();
  });

  applyBatchCodeLensBtnEl.addEventListener("click", () => {
    applyBatchCodeLensDemo();
  });

  clearCodeLensBtnEl.addEventListener("click", () => {
    clearCodeLensDemo();
  });

  applyLineLinksBtnEl.addEventListener("click", () => {
    applyLineLinksDemo();
  });

  applyBatchLinksBtnEl.addEventListener("click", () => {
    applyBatchLinksDemo();
  });

  clearLinksBtnEl.addEventListener("click", () => {
    clearLinksDemo();
  });

  imeScenarioSelectEl.addEventListener("change", () => {
    applySelectedImeScenario();
  });

  imeScenarioSelectEl.addEventListener("input", () => {
    applySelectedImeScenario();
  });

  imeScenarioSelectEl.value = imeScenarioSelectEl.value || "compOnImeOff";

  if (fileSelectEl.value === CODELENS_DEMO_FILE) {
    applyBatchCodeLensDemo();
    applyBatchLinksDemo();
  }
}

bootstrap().catch((error) => {
  console.error(error);
  setStatus(`Error: ${String(error)}`);
});
