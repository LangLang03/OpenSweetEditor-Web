export type IAnyValue = any;
export type IAnyRecord = Record<string, IAnyValue>;

export interface IEmbindDeletable {
  delete(): void;
}

export interface IEmbindVector<T> extends IEmbindDeletable {
  size(): number;
  get(index: number): T;
  push_back?(value: T): void;
}

export interface IEmbindEnumValue {
  value: number;
}

export type IEmbindEnumLike = number | IEmbindEnumValue;

export interface ITextPosition {
  line: number;
  column: number;
}

export interface ITextRange {
  start: ITextPosition;
  end: ITextPosition;
}

export interface INativeDocument extends IEmbindDeletable {
  getU8Text(): string;
  getLineCount(): number;
  getLineU16Text(line: number): string;
  getPositionFromCharIndex(charIndex: number): ITextPosition;
  getCharIndexFromPosition(position: ITextPosition): number;
}

export interface INativeEditorCore extends IEmbindDeletable {
  loadDocument(document: INativeDocument): IAnyValue;
  setViewport(size: { width: number; height: number }): IAnyValue;
  buildRenderModel(): IAnyValue;
  handleGestureEventRaw(
    type: number,
    points: IAnyValue,
    modifiers: number,
    wheelDeltaX: number,
    wheelDeltaY: number,
    directScale: number,
  ): IAnyValue;
  handleKeyEventRaw(keyCode: number, text: string, modifiers: number): IAnyValue;
  [key: string]: IAnyValue;
}

export interface ISweetEditorWasmModule extends IAnyRecord {
  EditorCore: new (textMeasurerCallbacks: IAnyRecord, nativeOptions: IAnyRecord) => INativeEditorCore;
  PieceTableDocument: new (text: string) => INativeDocument;
  LineArrayDocument: new (text: string) => INativeDocument;
}
