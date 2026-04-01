import type { ITextPosition, ITextRange } from "./embind-contracts.js";
import { WebEditorCore } from "./editor-core-legacy.internal.js";

export class EditorCore extends WebEditorCore {}

export interface ProtocolEncoder {
  encode(value: unknown): string;
}

export interface ProtocolDecoder {
  decode<T = unknown>(payload: string): T;
}

export class JsonProtocolEncoder implements ProtocolEncoder {
  encode(value: unknown): string {
    return JSON.stringify(value ?? null);
  }
}

export class JsonProtocolDecoder implements ProtocolDecoder {
  decode<T = unknown>(payload: string): T {
    return JSON.parse(String(payload ?? "null")) as T;
  }
}

export interface TextMeasurer {
  measureTextWidth(text: string, fontStyle?: number): number;
  measureInlayHintWidth?(text: string): number;
  measureIconWidth?(iconId: number): number;
}

export interface EditorOptions extends Record<string, unknown> {
  touchSlop?: number;
  doubleTapTimeout?: number;
  longPressMs?: number;
  maxUndoStackSize?: number;
}

export type TextPosition = ITextPosition;
export type TextRange = ITextRange;

export enum WrapMode {
  NONE = 0,
  CHAR_BREAK = 1,
  WORD_BREAK = 2,
}

export enum FoldArrowMode {
  MOUSE_OVER = 0,
  ALWAYS = 1,
}

export enum AutoIndentMode {
  NONE = 0,
  KEEP = 1,
}

export enum CurrentLineRenderMode {
  NONE = 0,
  LINE = 1,
  GUTTER = 2,
}

export enum ScrollBehavior {
  SMOOTH = 0,
  INSTANT = 1,
}

export enum SpanLayer {
  SYNTAX = 0,
  SEMANTIC = 1,
}

export enum InlayType {
  TEXT = 0,
  ICON = 1,
  COLOR_BLOCK = 2,
}

export enum SeparatorStyle {
  SOLID = 0,
  DASHED = 1,
  SINGLE = 0,
  DOUBLE = 1,
}

export interface StyleSpan { column: number; length: number; styleId: number; }
export interface InlayHint { type: InlayType; column: number; text?: string | null; intValue: number; }
export interface PhantomText { column: number; text: string; }
export interface FoldRegion { startLine: number; endLine: number; }
export interface GutterIcon { iconId: number; }
export interface DiagnosticItem { column: number; length: number; severity: number; color: number; }
export interface IndentGuide { start: TextPosition; end: TextPosition; }
export interface BracketGuide { parent: TextPosition; end: TextPosition; children: TextPosition[]; }
export interface FlowGuide { start: TextPosition; end: TextPosition; }
export interface SeparatorGuide { line: number; style: SeparatorStyle; count: number; textEndColumn: number; }
export interface TextStyle { color: number; backgroundColor: number; fontStyle: number; }

export interface PointF { x: number; y: number; }
export interface Cursor { line: number; column: number; x?: number; y?: number; height?: number; }
export interface CursorRect { origin: PointF; width: number; height: number; }
export interface SelectionRect { origin: PointF; width: number; height: number; }
export interface SelectionHandle { rect: CursorRect; }
export interface ScrollMetrics extends Record<string, unknown> {
  scrollX?: number;
  scrollY?: number;
  scroll_x?: number;
  scroll_y?: number;
  scale?: number;
}
export interface ScrollbarModel extends Record<string, unknown> {
  vertical?: ScrollbarRect | null;
  horizontal?: ScrollbarRect | null;
}
export interface ScrollbarRect { x: number; y: number; width: number; height: number; }
export interface GuideSegment { start: PointF; end: PointF; }
export enum GuideType {
  INDENT = 0,
  BRACKET = 1,
  FLOW = 2,
  SEPARATOR = 3,
}
export enum GuideDirection {
  HORIZONTAL = 0,
  VERTICAL = 1,
}
export enum GuideStyle {
  SOLID = 0,
  DASHED = 1,
}
export interface DiagnosticDecoration extends Record<string, unknown> {
  rect?: SelectionRect | null;
  color?: number;
  severity?: number;
}
export interface CompositionDecoration extends Record<string, unknown> {
  range?: TextRange | null;
  underlineColor?: number;
}
export enum FoldState {
  NONE = 0,
  COLLAPSED = 1,
  EXPANDED = 2,
}
export interface FoldMarkerRenderItem extends Record<string, unknown> {
  line?: number;
  state?: FoldState;
}
export interface GutterIconRenderItem extends Record<string, unknown> {
  line?: number;
  icons?: GutterIcon[];
}
export interface LinkedEditingRect extends Record<string, unknown> {
  rect?: SelectionRect;
  active?: boolean;
}
export interface BracketHighlightRect extends Record<string, unknown> {
  rect?: SelectionRect;
}
export enum VisualRunType {
  TEXT = 0,
  WHITESPACE = 1,
  INLAY_HINT = 2,
  PHANTOM_TEXT = 3,
  FOLD_PLACEHOLDER = 4,
  NEWLINE = 5,
}
export interface VisualRun extends Record<string, unknown> {
  type?: VisualRunType;
  text?: string;
  width?: number;
}
export interface VisualLine extends Record<string, unknown> {
  logicalLine?: number;
  runs?: VisualRun[];
}
export interface EditorRenderModel extends Record<string, unknown> {
  lines?: VisualLine[];
  cursor?: Cursor | null;
  cursorRect?: CursorRect | null;
  selectionRects?: SelectionRect[];
  scrollMetrics?: ScrollMetrics | null;
  scrollbarModel?: ScrollbarModel | null;
}

export interface TabStopGroup extends Record<string, unknown> {
  ranges?: TextRange[];
}
export interface LinkedEditingModel extends Record<string, unknown> {
  groups?: TabStopGroup[];
  activeGroupIndex?: number;
}
