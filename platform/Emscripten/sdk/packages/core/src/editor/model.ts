import { applyTextChangesToText, normalizeNewlines } from "../legacy/editor-core-legacy.js";

export interface IModelOptions {
  uri?: string;
  language?: string;
}

export interface ITextModel {
  readonly uri: string;
  readonly language: string;
  readonly versionId: number;
  getValue(): string;
  setValue(text: string): void;
  applyTextChanges(changes: unknown): void;
}

export class TextModel implements ITextModel {
  readonly uri: string;
  readonly language: string;
  private _value: string;
  private _versionId = 1;

  constructor(text: string, options: IModelOptions = {}) {
    this.uri = options.uri ?? "inmemory://model/1";
    this.language = options.language ?? "plain_text";
    this._value = normalizeNewlines(text);
  }

  get versionId(): number {
    return this._versionId;
  }

  getValue(): string {
    return this._value;
  }

  setValue(text: string): void {
    const normalized = normalizeNewlines(text);
    if (normalized === this._value) {
      return;
    }
    this._value = normalized;
    this._versionId += 1;
  }

  applyTextChanges(changes: unknown): void {
    const nextValue = applyTextChangesToText(this._value, changes as never, {
      normalizeNewlines: true,
    });
    if (nextValue === this._value) {
      return;
    }
    this._value = nextValue;
    this._versionId += 1;
  }
}

export function createTextModel(text: string, options: IModelOptions = {}): TextModel {
  return new TextModel(text, options);
}
