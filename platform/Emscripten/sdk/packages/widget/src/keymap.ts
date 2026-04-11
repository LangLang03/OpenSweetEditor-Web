import {
  EditorCommand,
  KeyCode,
  KeyModifier,
  type KeyBinding,
  type KeyChord,
  type KeyMap,
} from "@sweeteditor/core";
import type { SweetEditorWidget } from "./legacy/sweet-editor-widget-legacy.js";

export interface EditorCommandContext {
  commandId: number;
  binding: KeyBinding;
  widget: SweetEditorWidget;
  event?: KeyboardEvent | Event | null;
}

export type EditorCommandHandler = (
  context: EditorCommandContext,
) => boolean | void | Promise<boolean | void>;

export type EditorKeyMapResolveStatus = "matched" | "pending" | "no_match";

export interface EditorKeyMapResolveResult {
  status: EditorKeyMapResolveStatus;
  command: number;
  binding: KeyBinding | null;
}

type TChordMapEntry = number | Map<string, number>;

interface IEditorKeyMapOptions {
  pendingTimeoutMs?: number;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
}

function toInt(value: unknown, fallback = 0): number {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.trunc(n);
}

function clampNonNegativeInt(value: unknown, fallback = 0): number {
  const n = toInt(value, fallback);
  if (n < 0) {
    return fallback;
  }
  return n;
}

function emptyChord(): KeyChord {
  return { modifiers: KeyModifier.NONE, keyCode: KeyCode.NONE };
}

function cloneChord(chord: KeyChord | null | undefined): KeyChord {
  if (!chord) {
    return emptyChord();
  }
  return {
    modifiers: clampNonNegativeInt(chord.modifiers, KeyModifier.NONE),
    keyCode: clampNonNegativeInt(chord.keyCode, KeyCode.NONE),
  };
}

function normalizeChord(value: unknown): KeyChord {
  const record = asRecord(value);
  if (!record) {
    return emptyChord();
  }
  const keyCode = clampNonNegativeInt(record.keyCode ?? record.key_code ?? record.key, KeyCode.NONE);
  const modifiers = clampNonNegativeInt(record.modifiers ?? record.modifier ?? KeyModifier.NONE, KeyModifier.NONE);
  return { keyCode, modifiers };
}

function isEmptyChord(chord: KeyChord | null | undefined): boolean {
  if (!chord) {
    return true;
  }
  return toInt(chord.keyCode, KeyCode.NONE) === KeyCode.NONE;
}

function chordKey(chord: KeyChord): string {
  return `${toInt(chord.modifiers, KeyModifier.NONE)}:${toInt(chord.keyCode, KeyCode.NONE)}`;
}

function cloneBinding(binding: KeyBinding): KeyBinding {
  return {
    first: cloneChord(binding.first),
    second: cloneChord(binding.second ?? emptyChord()),
    command: clampNonNegativeInt(binding.command, EditorCommand.NONE),
  };
}

function normalizeBinding(value: unknown): KeyBinding {
  const record = asRecord(value);
  if (!record) {
    return { first: emptyChord(), second: emptyChord(), command: EditorCommand.NONE };
  }
  return {
    first: normalizeChord(record.first),
    second: normalizeChord(record.second),
    command: clampNonNegativeInt(record.command ?? record.commandId, EditorCommand.NONE),
  };
}

function toBindingList(input: KeyMap | Iterable<KeyBinding> | null | undefined): KeyBinding[] {
  if (!input) {
    return [];
  }
  if (Symbol.iterator in Object(input)) {
    const out: KeyBinding[] = [];
    for (const item of input as Iterable<KeyBinding>) {
      out.push(normalizeBinding(item));
    }
    return out;
  }

  const record = asRecord(input);
  const bindings = record?.bindings;
  if (!bindings || !(Symbol.iterator in Object(bindings))) {
    return [];
  }
  const out: KeyBinding[] = [];
  for (const item of bindings as Iterable<KeyBinding>) {
    out.push(normalizeBinding(item));
  }
  return out;
}

export class EditorKeyMap implements KeyMap {
  static readonly BUILT_IN_MAX = EditorCommand.BUILT_IN_MAX;

  private readonly _handlers = new Map<number, EditorCommandHandler>();
  private readonly _firstChordMap = new Map<string, TChordMapEntry>();
  private readonly _pendingTimeoutMs: number;

  private _bindings: KeyBinding[] = [];
  private _pendingSubMap: Map<string, number> | null = null;
  private _pendingFirstChord: KeyChord | null = null;
  private _pendingSince = 0;
  private _nextCustomCommandId = EditorCommand.BUILT_IN_MAX + 1;

  constructor(input: KeyMap | Iterable<KeyBinding> = [], options: IEditorKeyMapOptions = {}) {
    this._pendingTimeoutMs = Math.max(120, clampNonNegativeInt(options.pendingTimeoutMs, 2000));
    this.setBindings(input);
  }

  static from(input: KeyMap | Iterable<KeyBinding> | EditorKeyMap | null | undefined): EditorKeyMap {
    if (input instanceof EditorKeyMap) {
      return input.clone();
    }
    return new EditorKeyMap(input ?? []);
  }

  static defaultKeyMap(): EditorKeyMap {
    return defaultKeyMap();
  }

  static vscode(): EditorKeyMap {
    return vscode();
  }

  get bindings(): KeyBinding[] {
    return this._bindings.map((binding) => cloneBinding(binding));
  }

  set bindings(value: KeyBinding[]) {
    this.setBindings(value ?? []);
  }

  toKeyMap(): KeyMap {
    return { bindings: this.bindings };
  }

  toJSON(): KeyMap {
    return this.toKeyMap();
  }

  clone(): EditorKeyMap {
    const cloned = new EditorKeyMap(this._bindings, { pendingTimeoutMs: this._pendingTimeoutMs });
    for (const [commandId, handler] of this._handlers.entries()) {
      cloned._handlers.set(commandId, handler);
    }
    return cloned;
  }

  setBindings(input: KeyMap | Iterable<KeyBinding>): this {
    this._bindings = [];
    this._firstChordMap.clear();
    this._clearPending();
    this._nextCustomCommandId = EditorCommand.BUILT_IN_MAX + 1;

    const list = toBindingList(input);
    for (const binding of list) {
      this.addBinding(binding);
    }
    return this;
  }

  addBinding(binding: KeyBinding): this {
    const normalized = normalizeBinding(binding);
    if (isEmptyChord(normalized.first)) {
      return this;
    }

    const firstKey = chordKey(normalized.first);
    const secondChord = cloneChord(normalized.second ?? emptyChord());
    const command = clampNonNegativeInt(normalized.command, EditorCommand.NONE);
    normalized.command = command;
    normalized.second = secondChord;

    this._nextCustomCommandId = Math.max(this._nextCustomCommandId, command + 1);
    if (isEmptyChord(secondChord)) {
      this._firstChordMap.set(firstKey, command);
    } else {
      const existing = this._firstChordMap.get(firstKey);
      const subMap = existing instanceof Map ? existing : new Map<string, number>();
      subMap.set(chordKey(secondChord), command);
      this._firstChordMap.set(firstKey, subMap);
    }

    this._bindings.push(cloneBinding(normalized));
    return this;
  }

  registerCommand(binding: KeyBinding, handler: EditorCommandHandler): number {
    const normalized = normalizeBinding(binding);
    let commandId = clampNonNegativeInt(normalized.command, EditorCommand.NONE);
    if (commandId === EditorCommand.NONE) {
      commandId = this._nextCustomCommandId;
      this._nextCustomCommandId += 1;
    }

    normalized.command = commandId;
    this.addBinding(normalized);
    if (typeof handler === "function") {
      this._handlers.set(commandId, handler);
    }
    return commandId;
  }

  setCommandHandler(command: number, handler: EditorCommandHandler | null): this {
    const commandId = clampNonNegativeInt(command, EditorCommand.NONE);
    if (commandId === EditorCommand.NONE) {
      return this;
    }
    if (typeof handler === "function") {
      this._handlers.set(commandId, handler);
    } else {
      this._handlers.delete(commandId);
    }
    return this;
  }

  getCommandHandler(command: number): EditorCommandHandler | null {
    const commandId = clampNonNegativeInt(command, EditorCommand.NONE);
    if (commandId === EditorCommand.NONE) {
      return null;
    }
    return this._handlers.get(commandId) ?? null;
  }

  isPendingSequence(): boolean {
    if (!this._pendingSubMap) {
      return false;
    }
    const currentTime = Date.now();
    if (currentTime - this._pendingSince > this._pendingTimeoutMs) {
      this._clearPending();
      return false;
    }
    return true;
  }

  resolve(chord: KeyChord): EditorKeyMapResolveResult {
    const normalizedChord = normalizeChord(chord);
    const currentTime = Date.now();

    if (this._pendingSubMap) {
      const expired = currentTime - this._pendingSince > this._pendingTimeoutMs;
      const pendingSubMap = expired ? null : this._pendingSubMap;
      const pendingFirstChord = this._pendingFirstChord ? cloneChord(this._pendingFirstChord) : emptyChord();
      this._clearPending();
      if (pendingSubMap) {
        const command = pendingSubMap.get(chordKey(normalizedChord));
        if (typeof command === "number") {
          return {
            status: "matched",
            command,
            binding: {
              first: pendingFirstChord,
              second: cloneChord(normalizedChord),
              command,
            },
          };
        }
      }
      return { status: "no_match", command: EditorCommand.NONE, binding: null };
    }

    const entry = this._firstChordMap.get(chordKey(normalizedChord));
    if (entry === undefined) {
      return { status: "no_match", command: EditorCommand.NONE, binding: null };
    }

    if (typeof entry === "number") {
      return {
        status: "matched",
        command: entry,
        binding: {
          first: cloneChord(normalizedChord),
          second: emptyChord(),
          command: entry,
        },
      };
    }

    this._pendingSubMap = entry;
    this._pendingFirstChord = cloneChord(normalizedChord);
    this._pendingSince = currentTime;
    return { status: "pending", command: EditorCommand.NONE, binding: null };
  }

  private _clearPending() {
    this._pendingSubMap = null;
    this._pendingFirstChord = null;
    this._pendingSince = 0;
  }
}

function makeBinding(modifiers: number, keyCode: number, command: number): KeyBinding {
  return {
    first: { modifiers, keyCode },
    second: emptyChord(),
    command,
  };
}

function buildVscodeBindings(): KeyBinding[] {
  const bindings: KeyBinding[] = [];
  const add = (modifiers: number, keyCode: number, command: number) => {
    bindings.push(makeBinding(modifiers, keyCode, command));
  };

  // Cursor movement
  add(KeyModifier.NONE, KeyCode.LEFT, EditorCommand.CURSOR_LEFT);
  add(KeyModifier.NONE, KeyCode.RIGHT, EditorCommand.CURSOR_RIGHT);
  add(KeyModifier.NONE, KeyCode.UP, EditorCommand.CURSOR_UP);
  add(KeyModifier.NONE, KeyCode.DOWN, EditorCommand.CURSOR_DOWN);
  add(KeyModifier.NONE, KeyCode.HOME, EditorCommand.CURSOR_LINE_START);
  add(KeyModifier.NONE, KeyCode.END, EditorCommand.CURSOR_LINE_END);
  add(KeyModifier.NONE, KeyCode.PAGE_UP, EditorCommand.CURSOR_PAGE_UP);
  add(KeyModifier.NONE, KeyCode.PAGE_DOWN, EditorCommand.CURSOR_PAGE_DOWN);

  // Selection movement
  add(KeyModifier.SHIFT, KeyCode.LEFT, EditorCommand.SELECT_LEFT);
  add(KeyModifier.SHIFT, KeyCode.RIGHT, EditorCommand.SELECT_RIGHT);
  add(KeyModifier.SHIFT, KeyCode.UP, EditorCommand.SELECT_UP);
  add(KeyModifier.SHIFT, KeyCode.DOWN, EditorCommand.SELECT_DOWN);
  add(KeyModifier.SHIFT, KeyCode.HOME, EditorCommand.SELECT_LINE_START);
  add(KeyModifier.SHIFT, KeyCode.END, EditorCommand.SELECT_LINE_END);
  add(KeyModifier.SHIFT, KeyCode.PAGE_UP, EditorCommand.SELECT_PAGE_UP);
  add(KeyModifier.SHIFT, KeyCode.PAGE_DOWN, EditorCommand.SELECT_PAGE_DOWN);

  // Editing
  add(KeyModifier.NONE, KeyCode.BACKSPACE, EditorCommand.BACKSPACE);
  add(KeyModifier.NONE, KeyCode.DELETE_KEY, EditorCommand.DELETE_FORWARD);
  add(KeyModifier.NONE, KeyCode.TAB, EditorCommand.INSERT_TAB);
  add(KeyModifier.NONE, KeyCode.ENTER, EditorCommand.INSERT_NEWLINE);

  // Ctrl/Cmd shortcuts
  add(KeyModifier.CTRL, KeyCode.A, EditorCommand.SELECT_ALL);
  add(KeyModifier.META, KeyCode.A, EditorCommand.SELECT_ALL);
  add(KeyModifier.CTRL, KeyCode.Z, EditorCommand.UNDO);
  add(KeyModifier.META, KeyCode.Z, EditorCommand.UNDO);
  add(KeyModifier.CTRL | KeyModifier.SHIFT, KeyCode.Z, EditorCommand.REDO);
  add(KeyModifier.META | KeyModifier.SHIFT, KeyCode.Z, EditorCommand.REDO);
  add(KeyModifier.CTRL, KeyCode.Y, EditorCommand.REDO);
  add(KeyModifier.META, KeyCode.Y, EditorCommand.REDO);

  // Clipboard
  add(KeyModifier.CTRL, KeyCode.C, EditorCommand.COPY);
  add(KeyModifier.META, KeyCode.C, EditorCommand.COPY);
  add(KeyModifier.CTRL, KeyCode.V, EditorCommand.PASTE);
  add(KeyModifier.META, KeyCode.V, EditorCommand.PASTE);
  add(KeyModifier.CTRL, KeyCode.X, EditorCommand.CUT);
  add(KeyModifier.META, KeyCode.X, EditorCommand.CUT);
  add(KeyModifier.CTRL, KeyCode.SPACE, EditorCommand.TRIGGER_COMPLETION);
  add(KeyModifier.META, KeyCode.SPACE, EditorCommand.TRIGGER_COMPLETION);

  // Line operations
  add(KeyModifier.CTRL, KeyCode.ENTER, EditorCommand.INSERT_LINE_BELOW);
  add(KeyModifier.META, KeyCode.ENTER, EditorCommand.INSERT_LINE_BELOW);
  add(KeyModifier.CTRL | KeyModifier.SHIFT, KeyCode.ENTER, EditorCommand.INSERT_LINE_ABOVE);
  add(KeyModifier.META | KeyModifier.SHIFT, KeyCode.ENTER, EditorCommand.INSERT_LINE_ABOVE);

  add(KeyModifier.ALT, KeyCode.UP, EditorCommand.MOVE_LINE_UP);
  add(KeyModifier.ALT, KeyCode.DOWN, EditorCommand.MOVE_LINE_DOWN);
  add(KeyModifier.ALT | KeyModifier.SHIFT, KeyCode.UP, EditorCommand.COPY_LINE_UP);
  add(KeyModifier.ALT | KeyModifier.SHIFT, KeyCode.DOWN, EditorCommand.COPY_LINE_DOWN);

  add(KeyModifier.CTRL | KeyModifier.SHIFT, KeyCode.K, EditorCommand.DELETE_LINE);
  add(KeyModifier.META | KeyModifier.SHIFT, KeyCode.K, EditorCommand.DELETE_LINE);

  return bindings;
}

export function vscode(): EditorKeyMap {
  return new EditorKeyMap({ bindings: buildVscodeBindings() });
}

export function defaultKeyMap(): EditorKeyMap {
  return vscode();
}
