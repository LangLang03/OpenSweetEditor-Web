import { AutoIndentMode, CurrentLineRenderMode, FoldArrowMode, WrapMode } from './core/CoreFoundation';

export class EditorSettingsBridge {
  readonly applyTextSize: (size: number) => void;
  readonly applyFontFamily: (fontFamily: string) => void;
  readonly applyScale: (scale: number) => void;
  readonly applyFoldArrowMode: (mode: FoldArrowMode) => void;
  readonly applyWrapMode: (mode: WrapMode) => void;
  readonly applyLineSpacing: (add: number, mult: number) => void;
  readonly applyContentStartPadding: (padding: number) => void;
  readonly applyShowSplitLine: (show: boolean) => void;
  readonly applyGutterSticky: (sticky: boolean) => void;
  readonly applyGutterVisible: (visible: boolean) => void;
  readonly applyCurrentLineRenderMode: (mode: CurrentLineRenderMode) => void;
  readonly applyAutoIndentMode: (mode: AutoIndentMode) => void;
  readonly applyBackspaceUnindent: (enabled: boolean) => void;
  readonly applyReadOnly: (readOnly: boolean) => void;
  readonly applyCompositionEnabled: (enabled: boolean) => void;
  readonly applyMaxGutterIcons: (count: number) => void;
  readonly requestDecorationRefresh: () => void;

  constructor(
    applyTextSize: (size: number) => void,
    applyFontFamily: (fontFamily: string) => void,
    applyScale: (scale: number) => void,
    applyFoldArrowMode: (mode: FoldArrowMode) => void,
    applyWrapMode: (mode: WrapMode) => void,
    applyLineSpacing: (add: number, mult: number) => void,
    applyContentStartPadding: (padding: number) => void,
    applyShowSplitLine: (show: boolean) => void,
    applyGutterSticky: (sticky: boolean) => void,
    applyGutterVisible: (visible: boolean) => void,
    applyCurrentLineRenderMode: (mode: CurrentLineRenderMode) => void,
    applyAutoIndentMode: (mode: AutoIndentMode) => void,
    applyBackspaceUnindent: (enabled: boolean) => void,
    applyReadOnly: (readOnly: boolean) => void,
    applyCompositionEnabled: (enabled: boolean) => void,
    applyMaxGutterIcons: (count: number) => void,
    requestDecorationRefresh: () => void,
  ) {
    this.applyTextSize = applyTextSize;
    this.applyFontFamily = applyFontFamily;
    this.applyScale = applyScale;
    this.applyFoldArrowMode = applyFoldArrowMode;
    this.applyWrapMode = applyWrapMode;
    this.applyLineSpacing = applyLineSpacing;
    this.applyContentStartPadding = applyContentStartPadding;
    this.applyShowSplitLine = applyShowSplitLine;
    this.applyGutterSticky = applyGutterSticky;
    this.applyGutterVisible = applyGutterVisible;
    this.applyCurrentLineRenderMode = applyCurrentLineRenderMode;
    this.applyAutoIndentMode = applyAutoIndentMode;
    this.applyBackspaceUnindent = applyBackspaceUnindent;
    this.applyReadOnly = applyReadOnly;
    this.applyCompositionEnabled = applyCompositionEnabled;
    this.applyMaxGutterIcons = applyMaxGutterIcons;
    this.requestDecorationRefresh = requestDecorationRefresh;
  }
}

export class EditorSettings {
  private bridge: EditorSettingsBridge;
  private textSize: number = 28;
  private fontFamily: string = 'monospace';
  private scale: number = 1.0;
  private foldArrowMode: FoldArrowMode = FoldArrowMode.ALWAYS;
  private wrapMode: WrapMode = WrapMode.NONE;
  private lineSpacingAdd: number = 0;
  private lineSpacingMult: number = 1.0;
  private contentStartPadding: number = 0;
  private showSplitLine: boolean = true;
  private gutterSticky: boolean = true;
  private gutterVisible: boolean = true;
  private currentLineRenderMode: CurrentLineRenderMode = CurrentLineRenderMode.BACKGROUND;
  private autoIndentMode: AutoIndentMode = AutoIndentMode.KEEP_INDENT;
  private backspaceUnindent: boolean = true;
  private readOnly: boolean = false;
  private compositionEnabled: boolean = true;
  private maxGutterIcons: number = 0;
  private decorationScrollRefreshMinIntervalMs: number = 16;
  private decorationOverscanViewportMultiplier: number = 1.5;

  constructor(bridge: EditorSettingsBridge) {
    this.bridge = bridge;
  }

  setEditorTextSize(size: number): void {
    this.textSize = size;
    this.bridge.applyTextSize(size);
  }

  getEditorTextSize(): number {
    return this.textSize;
  }

  setFontFamily(fontFamily: string): void {
    this.fontFamily = fontFamily;
    this.bridge.applyFontFamily(fontFamily);
  }

  getFontFamily(): string {
    return this.fontFamily;
  }

  setScale(scale: number): void {
    this.scale = scale;
    this.bridge.applyScale(scale);
  }

  getScale(): number {
    return this.scale;
  }

  setFoldArrowMode(mode: FoldArrowMode): void {
    this.foldArrowMode = mode;
    this.bridge.applyFoldArrowMode(mode);
  }

  getFoldArrowMode(): FoldArrowMode {
    return this.foldArrowMode;
  }

  setWrapMode(mode: WrapMode): void {
    this.wrapMode = mode;
    this.bridge.applyWrapMode(mode);
  }

  getWrapMode(): WrapMode {
    return this.wrapMode;
  }

  setLineSpacing(add: number, mult: number): void {
    this.lineSpacingAdd = add;
    this.lineSpacingMult = mult;
    this.bridge.applyLineSpacing(add, mult);
  }

  getLineSpacingAdd(): number {
    return this.lineSpacingAdd;
  }

  getLineSpacingMult(): number {
    return this.lineSpacingMult;
  }

  setContentStartPadding(padding: number): void {
    this.contentStartPadding = Math.max(0, padding);
    this.bridge.applyContentStartPadding(this.contentStartPadding);
  }

  getContentStartPadding(): number {
    return this.contentStartPadding;
  }

  setShowSplitLine(show: boolean): void {
    this.showSplitLine = show;
    this.bridge.applyShowSplitLine(show);
  }

  isShowSplitLine(): boolean {
    return this.showSplitLine;
  }

  setGutterSticky(sticky: boolean): void {
    this.gutterSticky = sticky;
    this.bridge.applyGutterSticky(sticky);
  }

  isGutterSticky(): boolean {
    return this.gutterSticky;
  }

  setGutterVisible(visible: boolean): void {
    this.gutterVisible = visible;
    this.bridge.applyGutterVisible(visible);
  }

  isGutterVisible(): boolean {
    return this.gutterVisible;
  }

  setCurrentLineRenderMode(mode: CurrentLineRenderMode): void {
    this.currentLineRenderMode = mode;
    this.bridge.applyCurrentLineRenderMode(mode);
  }

  getCurrentLineRenderMode(): CurrentLineRenderMode {
    return this.currentLineRenderMode;
  }

  setAutoIndentMode(mode: AutoIndentMode): void {
    this.autoIndentMode = mode;
    this.bridge.applyAutoIndentMode(mode);
  }

  getAutoIndentMode(): AutoIndentMode {
    return this.autoIndentMode;
  }

  setBackspaceUnindent(enabled: boolean): void {
    this.backspaceUnindent = enabled;
    this.bridge.applyBackspaceUnindent(enabled);
  }

  isBackspaceUnindent(): boolean {
    return this.backspaceUnindent;
  }

  setReadOnly(readOnly: boolean): void {
    this.readOnly = readOnly;
    this.bridge.applyReadOnly(readOnly);
  }

  isReadOnly(): boolean {
    return this.readOnly;
  }

  setCompositionEnabled(enabled: boolean): void {
    this.compositionEnabled = enabled;
    this.bridge.applyCompositionEnabled(enabled);
  }

  isCompositionEnabled(): boolean {
    return this.compositionEnabled;
  }

  setMaxGutterIcons(count: number): void {
    this.maxGutterIcons = count;
    this.bridge.applyMaxGutterIcons(count);
  }

  getMaxGutterIcons(): number {
    return this.maxGutterIcons;
  }

  setDecorationScrollRefreshMinIntervalMs(intervalMs: number): void {
    this.decorationScrollRefreshMinIntervalMs = Math.max(0, intervalMs);
    this.bridge.requestDecorationRefresh();
  }

  getDecorationScrollRefreshMinIntervalMs(): number {
    return this.decorationScrollRefreshMinIntervalMs;
  }

  setDecorationOverscanViewportMultiplier(multiplier: number): void {
    this.decorationOverscanViewportMultiplier = Math.max(0, multiplier);
    this.bridge.requestDecorationRefresh();
  }

  getDecorationOverscanViewportMultiplier(): number {
    return this.decorationOverscanViewportMultiplier;
  }
}

