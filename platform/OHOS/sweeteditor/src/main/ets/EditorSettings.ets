import { AutoIndentMode, CurrentLineRenderMode, FoldArrowMode, WrapMode } from './core/CoreFoundation';

const DEFAULT_CONTENT_START_PADDING: number = 3.0;
const DEFAULT_GUTTER_STICKY: boolean = false;

export class EditorSettings {
  private host: {
    applyEditorTextSize: (size: number) => void;
    applyFontFamily: (fontFamily: string) => void;
    applyScale: (scale: number) => void;
    applyFoldArrowMode: (mode: FoldArrowMode) => void;
    applyWrapMode: (mode: WrapMode) => void;
    applyLineSpacing: (add: number, mult: number) => void;
    applyContentStartPadding: (padding: number) => void;
    applyShowSplitLine: (show: boolean) => void;
    applyGutterSticky: (sticky: boolean) => void;
    applyGutterVisible: (visible: boolean) => void;
    applyCurrentLineRenderMode: (mode: CurrentLineRenderMode) => void;
    applyAutoIndentMode: (mode: AutoIndentMode) => void;
    applyBackspaceUnindent: (enabled: boolean) => void;
    applyReadOnly: (readOnly: boolean) => void;
    applyCompositionEnabled: (enabled: boolean) => void;
    applyMaxGutterIcons: (count: number) => void;
    requestDecorationRefresh: () => void;
  } | null = null;
  private textSize: number = 28;
  private fontFamily: string = 'monospace';
  private scale: number = 1.0;
  private foldArrowMode: FoldArrowMode = FoldArrowMode.ALWAYS;
  private wrapMode: WrapMode = WrapMode.NONE;
  private lineSpacingAdd: number = 0;
  private lineSpacingMult: number = 1.0;
  private contentStartPadding: number = DEFAULT_CONTENT_START_PADDING;
  private showSplitLine: boolean = true;
  private gutterSticky: boolean = DEFAULT_GUTTER_STICKY;
  private gutterVisible: boolean = true;
  private currentLineRenderMode: CurrentLineRenderMode = CurrentLineRenderMode.BACKGROUND;
  private autoIndentMode: AutoIndentMode = AutoIndentMode.KEEP_INDENT;
  private backspaceUnindent: boolean = true;
  private readOnly: boolean = false;
  private compositionEnabled: boolean = true;
  private maxGutterIcons: number = 0;
  private decorationScrollRefreshMinIntervalMs: number = 16;
  private decorationOverscanViewportMultiplier: number = 1.5;

  bind(host: {
    applyEditorTextSize: (size: number) => void;
    applyFontFamily: (fontFamily: string) => void;
    applyScale: (scale: number) => void;
    applyFoldArrowMode: (mode: FoldArrowMode) => void;
    applyWrapMode: (mode: WrapMode) => void;
    applyLineSpacing: (add: number, mult: number) => void;
    applyContentStartPadding: (padding: number) => void;
    applyShowSplitLine: (show: boolean) => void;
    applyGutterSticky: (sticky: boolean) => void;
    applyGutterVisible: (visible: boolean) => void;
    applyCurrentLineRenderMode: (mode: CurrentLineRenderMode) => void;
    applyAutoIndentMode: (mode: AutoIndentMode) => void;
    applyBackspaceUnindent: (enabled: boolean) => void;
    applyReadOnly: (readOnly: boolean) => void;
    applyCompositionEnabled: (enabled: boolean) => void;
    applyMaxGutterIcons: (count: number) => void;
    requestDecorationRefresh: () => void;
  }): void {
    this.host = host;
    this.applyAll();
  }

  unbind(host: {
    applyEditorTextSize: (size: number) => void;
    applyFontFamily: (fontFamily: string) => void;
    applyScale: (scale: number) => void;
    applyFoldArrowMode: (mode: FoldArrowMode) => void;
    applyWrapMode: (mode: WrapMode) => void;
    applyLineSpacing: (add: number, mult: number) => void;
    applyContentStartPadding: (padding: number) => void;
    applyShowSplitLine: (show: boolean) => void;
    applyGutterSticky: (sticky: boolean) => void;
    applyGutterVisible: (visible: boolean) => void;
    applyCurrentLineRenderMode: (mode: CurrentLineRenderMode) => void;
    applyAutoIndentMode: (mode: AutoIndentMode) => void;
    applyBackspaceUnindent: (enabled: boolean) => void;
    applyReadOnly: (readOnly: boolean) => void;
    applyCompositionEnabled: (enabled: boolean) => void;
    applyMaxGutterIcons: (count: number) => void;
    requestDecorationRefresh: () => void;
  }): void {
    if (this.host === host) {
      this.host = null;
    }
  }

  setEditorTextSize(size: number): void {
    this.textSize = size;
    this.host?.applyEditorTextSize(size);
  }

  getEditorTextSize(): number {
    return this.textSize;
  }

  setFontFamily(fontFamily: string): void {
    this.fontFamily = fontFamily;
    this.host?.applyFontFamily(fontFamily);
  }

  getFontFamily(): string {
    return this.fontFamily;
  }

  setScale(scale: number): void {
    this.scale = scale;
    this.host?.applyScale(scale);
  }

  getScale(): number {
    return this.scale;
  }

  setFoldArrowMode(mode: FoldArrowMode): void {
    this.foldArrowMode = mode;
    this.host?.applyFoldArrowMode(mode);
  }

  getFoldArrowMode(): FoldArrowMode {
    return this.foldArrowMode;
  }

  setWrapMode(mode: WrapMode): void {
    this.wrapMode = mode;
    this.host?.applyWrapMode(mode);
  }

  getWrapMode(): WrapMode {
    return this.wrapMode;
  }

  setLineSpacing(add: number, mult: number): void {
    this.lineSpacingAdd = add;
    this.lineSpacingMult = mult;
    this.host?.applyLineSpacing(add, mult);
  }

  getLineSpacingAdd(): number {
    return this.lineSpacingAdd;
  }

  getLineSpacingMult(): number {
    return this.lineSpacingMult;
  }

  setContentStartPadding(padding: number): void {
    this.contentStartPadding = Math.max(0, padding);
    this.host?.applyContentStartPadding(this.contentStartPadding);
  }

  getContentStartPadding(): number {
    return this.contentStartPadding;
  }

  setShowSplitLine(show: boolean): void {
    this.showSplitLine = show;
    this.host?.applyShowSplitLine(show);
  }

  isShowSplitLine(): boolean {
    return this.showSplitLine;
  }

  setGutterSticky(sticky: boolean): void {
    this.gutterSticky = sticky;
    this.host?.applyGutterSticky(sticky);
  }

  isGutterSticky(): boolean {
    return this.gutterSticky;
  }

  setGutterVisible(visible: boolean): void {
    this.gutterVisible = visible;
    this.host?.applyGutterVisible(visible);
  }

  isGutterVisible(): boolean {
    return this.gutterVisible;
  }

  setCurrentLineRenderMode(mode: CurrentLineRenderMode): void {
    this.currentLineRenderMode = mode;
    this.host?.applyCurrentLineRenderMode(mode);
  }

  getCurrentLineRenderMode(): CurrentLineRenderMode {
    return this.currentLineRenderMode;
  }

  setAutoIndentMode(mode: AutoIndentMode): void {
    this.autoIndentMode = mode;
    this.host?.applyAutoIndentMode(mode);
  }

  getAutoIndentMode(): AutoIndentMode {
    return this.autoIndentMode;
  }

  setBackspaceUnindent(enabled: boolean): void {
    this.backspaceUnindent = enabled;
    this.host?.applyBackspaceUnindent(enabled);
  }

  isBackspaceUnindent(): boolean {
    return this.backspaceUnindent;
  }

  setReadOnly(readOnly: boolean): void {
    this.readOnly = readOnly;
    this.host?.applyReadOnly(readOnly);
  }

  isReadOnly(): boolean {
    return this.readOnly;
  }

  setCompositionEnabled(enabled: boolean): void {
    this.compositionEnabled = enabled;
    this.host?.applyCompositionEnabled(enabled);
  }

  isCompositionEnabled(): boolean {
    return this.compositionEnabled;
  }

  setMaxGutterIcons(count: number): void {
    this.maxGutterIcons = count;
    this.host?.applyMaxGutterIcons(count);
  }

  getMaxGutterIcons(): number {
    return this.maxGutterIcons;
  }

  setDecorationScrollRefreshMinIntervalMs(intervalMs: number): void {
    this.decorationScrollRefreshMinIntervalMs = Math.max(0, intervalMs);
    this.host?.requestDecorationRefresh();
  }

  getDecorationScrollRefreshMinIntervalMs(): number {
    return this.decorationScrollRefreshMinIntervalMs;
  }

  setDecorationOverscanViewportMultiplier(multiplier: number): void {
    this.decorationOverscanViewportMultiplier = Math.max(0, multiplier);
    this.host?.requestDecorationRefresh();
  }

  getDecorationOverscanViewportMultiplier(): number {
    return this.decorationOverscanViewportMultiplier;
  }

  private applyAll(): void {
    const host = this.host;
    if (!host) {
      return;
    }
    host.applyEditorTextSize(this.textSize);
    host.applyFontFamily(this.fontFamily);
    host.applyScale(this.scale);
    host.applyFoldArrowMode(this.foldArrowMode);
    host.applyWrapMode(this.wrapMode);
    host.applyLineSpacing(this.lineSpacingAdd, this.lineSpacingMult);
    host.applyContentStartPadding(this.contentStartPadding);
    host.applyShowSplitLine(this.showSplitLine);
    host.applyGutterSticky(this.gutterSticky);
    host.applyGutterVisible(this.gutterVisible);
    host.applyCurrentLineRenderMode(this.currentLineRenderMode);
    host.applyAutoIndentMode(this.autoIndentMode);
    host.applyBackspaceUnindent(this.backspaceUnindent);
    host.applyReadOnly(this.readOnly);
    host.applyCompositionEnabled(this.compositionEnabled);
    host.applyMaxGutterIcons(this.maxGutterIcons);
    host.requestDecorationRefresh();
  }
}
