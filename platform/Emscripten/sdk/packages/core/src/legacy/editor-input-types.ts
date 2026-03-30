import type { IAnyRecord, ITextPosition, ITextRange } from "./embind-contracts.js";

export interface IEditorPointerPoint {
  x: number;
  y: number;
  id?: number;
}

export interface IEditorGestureEvent {
  type: number;
  points: IEditorPointerPoint[] | IAnyRecord;
  modifiers?: number;
  wheel_delta_x?: number;
  wheel_delta_y?: number;
  direct_scale?: number;
}

export interface IEditorKeyEvent {
  key_code: number;
  text?: string;
  modifiers?: number;
}

export interface IEditorTextChange {
  range: ITextRange | null;
  oldText?: string;
  old_text?: string;
  newText?: string;
  new_text?: string;
}

export interface IVisibleLineRange {
  start: number;
  end: number;
  startLine?: number;
  endLine?: number;
}

export interface ILanguageBracketPair {
  open: string;
  close: string;
  autoClose?: boolean;
  surround?: boolean;
}

export interface ILanguageConfiguration {
  bracketPairs?: ILanguageBracketPair[];
  [key: string]: IAnyRecord | ITextPosition | ITextRange | IEditorPointerPoint | string | number | boolean | null | undefined;
}

export interface IEditorMetadata {
  fileName?: string;
  language?: string;
  cursorPosition?: ITextPosition;
  [key: string]: IAnyRecord | ITextPosition | ITextRange | IEditorPointerPoint | string | number | boolean | null | undefined;
}
