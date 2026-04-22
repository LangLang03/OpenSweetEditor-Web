import type {
  IAnyValue,
  KeyBinding as CoreKeyBinding,
  KeyChord as CoreKeyChord,
  KeyMap as CoreKeyMap,
  CompletionContext as CoreCompletionContext,
  CompletionItem as CoreCompletionItem,
  CompletionProvider as CoreCompletionProvider,
  CompletionProviderManager as CoreCompletionProviderManager,
  CompletionResult as CoreCompletionResult,
  DecorationContext as CoreDecorationContext,
  DecorationProvider as CoreDecorationProvider,
  DecorationProviderManager as CoreDecorationProviderManager,
  DecorationResult as CoreDecorationResult,
  TextStyle as CoreTextStyle,
} from "@sweeteditor/core";
import {
  DecorationType as CoreDecorationType,
  EditorCommand,
  KeyCode,
  KeyModifier,
} from "@sweeteditor/core";

export type EditorColor = number | string;
export type TextStyle = CoreTextStyle;
export type KeyChord = CoreKeyChord;
export type KeyBinding = CoreKeyBinding;
export type KeyMap = CoreKeyMap;
export { KeyCode, KeyModifier, EditorCommand };

export interface EditorTheme extends Record<string, unknown> {
  backgroundColor?: EditorColor;
  textColor?: EditorColor;
  cursorColor?: EditorColor;
  selectionColor?: EditorColor;
  lineNumberColor?: EditorColor;
  currentLineNumberColor?: EditorColor;
  currentLineColor?: EditorColor;
  guideColor?: EditorColor;
  separatorLineColor?: EditorColor;
  splitLineColor?: EditorColor;
  scrollbarTrackColor?: EditorColor;
  scrollbarThumbColor?: EditorColor;
  scrollbarThumbActiveColor?: EditorColor;
  compositionUnderlineColor?: EditorColor;
  inlayHintBgColor?: EditorColor;
  inlayHintTextColor?: EditorColor;
  inlayHintIconColor?: EditorColor;
  foldPlaceholderBgColor?: EditorColor;
  foldPlaceholderTextColor?: EditorColor;
  phantomTextColor?: EditorColor;
  diagnosticErrorColor?: EditorColor;
  diagnosticWarningColor?: EditorColor;
  diagnosticInfoColor?: EditorColor;
  diagnosticHintColor?: EditorColor;
  linkedEditingActiveColor?: EditorColor;
  linkedEditingInactiveColor?: EditorColor;
  bracketHighlightBorderColor?: EditorColor;
  bracketHighlightBgColor?: EditorColor;
  completionBgColor?: EditorColor;
  completionBorderColor?: EditorColor;
  completionSelectedBgColor?: EditorColor;
  completionLabelColor?: EditorColor;
  completionDetailColor?: EditorColor;
  textStyles?: Record<number, TextStyle>;

  // Legacy aliases used by the current web renderer.
  background?: EditorColor;
  text?: EditorColor;
  lineNumber?: EditorColor;
  splitLine?: EditorColor;
  currentLine?: EditorColor;
  selection?: EditorColor;
  cursor?: EditorColor;
  inlayHintBg?: EditorColor;
  foldPlaceholderBg?: EditorColor;
  foldPlaceholderText?: EditorColor;
  phantomText?: EditorColor;
}

function cloneTheme(theme:EditorTheme): EditorTheme {
  return {
    ...theme,
    textStyles: theme.textStyles ? { ...theme.textStyles } : {},
  };
}

const DARK_THEME: EditorTheme = {
  backgroundColor: "#1e1e1e",
  textColor: "#d4d4d4",
  cursorColor: "#ffffff",
  selectionColor: "rgba(90,140,255,0.30)",
  lineNumberColor: "#858585",
  currentLineNumberColor: "#b3b3b3",
  currentLineColor: "rgba(255,255,255,0.06)",
  guideColor: "rgba(255,255,255,0.20)",
  separatorLineColor: "rgba(255,255,255,0.18)",
  splitLineColor: "#333333",
  scrollbarTrackColor: "rgba(255,255,255,0.08)",
  scrollbarThumbColor: "rgba(255,255,255,0.25)",
  scrollbarThumbActiveColor: "rgba(255,255,255,0.38)",
  compositionUnderlineColor: "#6ea3ff",
  inlayHintBgColor: "rgba(80,80,80,0.85)",
  inlayHintTextColor: "rgba(215,215,215,0.88)",
  inlayHintIconColor: "rgba(215,215,215,0.80)",
  foldPlaceholderBgColor: "rgba(70,70,70,0.9)",
  foldPlaceholderTextColor: "#cfcfcf",
  phantomTextColor: "rgba(180,180,180,0.75)",
  diagnosticErrorColor: "#f14c4c",
  diagnosticWarningColor: "#cca700",
  diagnosticInfoColor: "#3794ff",
  diagnosticHintColor: "#8f8f8f",
  linkedEditingActiveColor: "#4ea1ff",
  linkedEditingInactiveColor: "rgba(78,161,255,0.45)",
  bracketHighlightBorderColor: "#8ab4ff",
  bracketHighlightBgColor: "rgba(138,180,255,0.18)",
  completionBgColor: "#252526",
  completionBorderColor: "#454545",
  completionSelectedBgColor: "#04395e",
  completionLabelColor: "#d4d4d4",
  completionDetailColor: "#9da3a6",
  textStyles: {},
};

const LIGHT_THEME: EditorTheme = {
  backgroundColor: "#ffffff",
  textColor: "#222222",
  cursorColor: "#000000",
  selectionColor: "rgba(38,132,255,0.24)",
  lineNumberColor: "#777777",
  currentLineNumberColor: "#2f2f2f",
  currentLineColor: "rgba(0,0,0,0.05)",
  guideColor: "rgba(0,0,0,0.20)",
  separatorLineColor: "rgba(0,0,0,0.15)",
  splitLineColor: "#dddddd",
  scrollbarTrackColor: "rgba(0,0,0,0.06)",
  scrollbarThumbColor: "rgba(0,0,0,0.22)",
  scrollbarThumbActiveColor: "rgba(0,0,0,0.34)",
  compositionUnderlineColor: "#2a6de0",
  inlayHintBgColor: "rgba(232,232,232,0.9)",
  inlayHintTextColor: "rgba(64,64,64,0.86)",
  inlayHintIconColor: "rgba(64,64,64,0.78)",
  foldPlaceholderBgColor: "rgba(227,227,227,0.95)",
  foldPlaceholderTextColor: "#4f4f4f",
  phantomTextColor: "rgba(120,120,120,0.72)",
  diagnosticErrorColor: "#d9342b",
  diagnosticWarningColor: "#a06900",
  diagnosticInfoColor: "#116ad9",
  diagnosticHintColor: "#7a7a7a",
  linkedEditingActiveColor: "#116ad9",
  linkedEditingInactiveColor: "rgba(17,106,217,0.42)",
  bracketHighlightBorderColor: "#3f79d0",
  bracketHighlightBgColor: "rgba(63,121,208,0.16)",
  completionBgColor: "#ffffff",
  completionBorderColor: "#d8d8d8",
  completionSelectedBgColor: "#e8f2ff",
  completionLabelColor: "#1f1f1f",
  completionDetailColor: "#636363",
  textStyles: {},
};

export namespace EditorTheme {
  export const STYLE_KEYWORD = 1;
  export const STYLE_STRING = 2;
  export const STYLE_COMMENT = 3;
  export const STYLE_NUMBER = 4;
  export const STYLE_BUILTIN = 5;
  export const STYLE_TYPE = 6;
  export const STYLE_CLASS = 7;
  export const STYLE_FUNCTION = 8;
  export const STYLE_VARIABLE = 9;
  export const STYLE_PUNCTUATION = 10;
  export const STYLE_ANNOTATION = 11;
  export const STYLE_PREPROCESSOR = 12;
  export const STYLE_USER_BASE = 100;

  export function dark(): EditorTheme {
    return cloneTheme(DARK_THEME);
  }

  export function light(): EditorTheme {
    return cloneTheme(LIGHT_THEME);
  }

  export function defineTextStyle(theme:EditorTheme, styleId:number, style:TextStyle): EditorTheme {
    const next = cloneTheme(theme || {});
    if (!next.textStyles) {
      next.textStyles = {};
    }
    next.textStyles[styleId] = { ...style };
    return next;
  }
}

export interface EditorSettings {
  setEditorTextSize(size: number): void;
  getEditorTextSize(): number;
  setTypeface(typeface: unknown): void;
  getTypeface(): unknown;
  setFontFamily(family: string): void;
  getFontFamily(): string;
  setScale(scale: number): void;
  getScale(): number;
  setFoldArrowMode(mode: IAnyValue): void;
  getFoldArrowMode(): number;
  setWrapMode(mode: IAnyValue): void;
  getWrapMode(): number;
  setTabSize(tabSize: number): void;
  setBackspaceUnindent(enabled: boolean): void;
  setInsertSpaces(enabled: boolean): void;
  setLineSpacing(add: number, mult: number): void;
  getLineSpacingAdd(): number;
  getLineSpacingMult(): number;
  setContentStartPadding(padding: number): void;
  getContentStartPadding(): number;
  setShowSplitLine(show: boolean): void;
  isShowSplitLine(): boolean;
  setGutterSticky(sticky: boolean): void;
  isGutterSticky(): boolean;
  setGutterVisible(visible: boolean): void;
  isGutterVisible(): boolean;
  setCurrentLineRenderMode(mode: IAnyValue): void;
  getCurrentLineRenderMode(): number;
  setCompositionEnabled(enabled: boolean): void;
  isCompositionEnabled(): boolean;
  setAutoIndentMode(mode: IAnyValue): void;
  getAutoIndentMode(): number;
  setReadOnly(readOnly: boolean): void;
  isReadOnly(): boolean;
  setMaxGutterIcons(count: number): void;
  getMaxGutterIcons(): number;
  setDecorationScrollRefreshMinIntervalMs(ms: number): void;
  getDecorationScrollRefreshMinIntervalMs(): number;
  setDecorationOverscanViewportMultiplier(mult: number): void;
  getDecorationOverscanViewportMultiplier(): number;
  flush(): void;
}

export interface EditorIconProvider {
  resolve?(iconId: number): unknown;
}

export interface EditorMetadata extends Record<string, unknown> {
  fileName?: string;
  language?: string;
}

export interface BracketPair {
  open: string;
  close: string;
}

export interface LanguageConfiguration {
  languageId?: string;
  brackets?: BracketPair[];
  autoClosingPairs?: BracketPair[];
  tabSize?: number | null;
  insertSpaces?: boolean | null;
  [key: string]: unknown;
}

export type DecorationProvider = CoreDecorationProvider;
export type DecorationProviderManager = CoreDecorationProviderManager;
export type DecorationContext = CoreDecorationContext;
export type DecorationResult = CoreDecorationResult;
export { CoreDecorationType as DecorationType };

export type CompletionProvider = CoreCompletionProvider;
export type CompletionProviderManager = CoreCompletionProviderManager;
export type CompletionContext = CoreCompletionContext;
export type CompletionItem = CoreCompletionItem;
export type CompletionResult = CoreCompletionResult;

export interface NewLineContext {
  lineNumber: number;
  column: number;
  lineText: string;
  languageConfiguration?: LanguageConfiguration | null;
  editorMetadata?: EditorMetadata | null;
}

export interface NewLineAction {
  text: string;
}

export interface NewLineActionProvider {
  provideNewLineAction(context: NewLineContext): NewLineAction | string | null | undefined;
}

export type NewLineActionProviderLike =
  | NewLineActionProvider
  | ((context: NewLineContext) => NewLineAction | string | null | undefined);

export class NewLineActionProviderManager {
  private readonly _providers = new Set<NewLineActionProviderLike>();

  add(provider: NewLineActionProviderLike) {
    const isSupported = typeof provider === "function"
      || (provider && typeof provider.provideNewLineAction === "function");
    if (isSupported) {
      this._providers.add(provider);
    }
  }

  remove(provider: NewLineActionProviderLike) {
    this._providers.delete(provider);
  }

  provide(context: NewLineContext): NewLineAction | null {
    for (const provider of this._providers) {
      const action = typeof provider === "function"
        ? provider(context)
        : provider.provideNewLineAction(context);
      if (action == null) {
        continue;
      }
      if (typeof action === "string") {
        return { text: action };
      }
      return { text: String(action.text ?? "") };
    }
    return null;
  }
}

export type EditorEventName =
  | "TextChangedEvent" | "CursorChangedEvent" | "SelectionChangedEvent" | "ScrollChangedEvent" | "ScaleChangedEvent"
  | "DocumentLoadedEvent" | "FoldToggleEvent" | "GutterIconClickEvent" | "InlayHintClickEvent" | "CodeLensClickEvent" | "LinkClickEvent" | "LongPressEvent"
  | "DoubleTapEvent" | "ContextMenuEvent"
  | "TextChanged" | "CursorChanged" | "SelectionChanged" | "ScrollChanged" | "ScaleChanged"
  | "DocumentLoaded" | "FoldToggle" | "GutterIconClick" | "InlayHintClick" | "CodeLensClick" | "LinkClick" | "LongPress"
  | "DoubleTap" | "ContextMenu";

export interface EditorEvent<
  TType extends EditorEventName = EditorEventName,
  TPayload extends Record<string, unknown> = Record<string, unknown>,
> {
  type: TType;
  standardType?: string;
  legacyType?: string;
  timestamp: number;
  editor?: IAnyValue;
  payload?: TPayload;
}

export interface TextChangedEvent extends EditorEvent<"TextChangedEvent" | "TextChanged"> {}
export interface CursorChangedEvent extends EditorEvent<"CursorChangedEvent" | "CursorChanged"> {}
export interface SelectionChangedEvent extends EditorEvent<"SelectionChangedEvent" | "SelectionChanged"> {}
export interface ScrollChangedEvent extends EditorEvent<"ScrollChangedEvent" | "ScrollChanged"> {}
export interface ScaleChangedEvent extends EditorEvent<"ScaleChangedEvent" | "ScaleChanged"> {}
export interface DocumentLoadedEvent extends EditorEvent<"DocumentLoadedEvent" | "DocumentLoaded"> {}
export interface FoldToggleEvent extends EditorEvent<"FoldToggleEvent" | "FoldToggle"> {}
export interface GutterIconClickEvent extends EditorEvent<"GutterIconClickEvent" | "GutterIconClick"> {}
export interface InlayHintClickEvent extends EditorEvent<"InlayHintClickEvent" | "InlayHintClick"> {}
export interface CodeLensClickEvent extends EditorEvent<"CodeLensClickEvent" | "CodeLensClick"> {}
export interface LinkClickEvent extends EditorEvent<"LinkClickEvent" | "LinkClick"> {}
export interface LongPressEvent extends EditorEvent<"LongPressEvent" | "LongPress"> {}
export interface DoubleTapEvent extends EditorEvent<"DoubleTapEvent" | "DoubleTap"> {}
export interface ContextMenuEvent extends EditorEvent<"ContextMenuEvent" | "ContextMenu"> {}
