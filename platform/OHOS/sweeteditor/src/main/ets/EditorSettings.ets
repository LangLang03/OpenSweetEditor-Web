import { AutoIndentMode, CurrentLineRenderMode, FoldArrowMode, WrapMode } from './core/CoreFoundation';
import { SweetEditor } from './SweetEditor';

export class EditorSettings {
  private editor: SweetEditor | null = null;
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

  bind(editor: SweetEditor): void {
    this.editor = editor;
    this.applyAll();
  }

  unbind(editor: SweetEditor): void {
    if (this.editor === editor) {
      this.editor = null;
    }
  }

  setEditorTextSize(size: number): void {
    this.textSize = size;
    this.editor?.applySettingsTextSize(size);
  }

  getEditorTextSize(): number {
    return this.textSize;
  }

  setFontFamily(fontFamily: string): void {
    this.fontFamily = fontFamily;
    this.editor?.applySettingsFontFamily(fontFamily);
  }

  getFontFamily(): string {
    return this.fontFamily;
  }

  setScale(scale: number): void {
    this.scale = scale;
    this.editor?.applySettingsScale(scale);
  }

  getScale(): number {
    return this.scale;
  }

  setFoldArrowMode(mode: FoldArrowMode): void {
    this.foldArrowMode = mode;
    this.editor?.applySettingsFoldArrowMode(mode);
  }

  getFoldArrowMode(): FoldArrowMode {
    return this.foldArrowMode;
  }

  setWrapMode(mode: WrapMode): void {
    this.wrapMode = mode;
    this.editor?.applySettingsWrapMode(mode);
  }

  getWrapMode(): WrapMode {
    return this.wrapMode;
  }

  setLineSpacing(add: number, mult: number): void {
    this.lineSpacingAdd = add;
    this.lineSpacingMult = mult;
    this.editor?.applySettingsLineSpacing(add, mult);
  }

  getLineSpacingAdd(): number {
    return this.lineSpacingAdd;
  }

  getLineSpacingMult(): number {
    return this.lineSpacingMult;
  }

  setContentStartPadding(padding: number): void {
    this.contentStartPadding = Math.max(0, padding);
    this.editor?.applySettingsContentStartPadding(this.contentStartPadding);
  }

  getContentStartPadding(): number {
    return this.contentStartPadding;
  }

  setShowSplitLine(show: boolean): void {
    this.showSplitLine = show;
    this.editor?.applySettingsShowSplitLine(show);
  }

  isShowSplitLine(): boolean {
    return this.showSplitLine;
  }

  setGutterSticky(sticky: boolean): void {
    this.gutterSticky = sticky;
    this.editor?.applySettingsGutterSticky(sticky);
  }

  isGutterSticky(): boolean {
    return this.gutterSticky;
  }

  setGutterVisible(visible: boolean): void {
    this.gutterVisible = visible;
    this.editor?.applySettingsGutterVisible(visible);
  }

  isGutterVisible(): boolean {
    return this.gutterVisible;
  }

  setCurrentLineRenderMode(mode: CurrentLineRenderMode): void {
    this.currentLineRenderMode = mode;
    this.editor?.applySettingsCurrentLineRenderMode(mode);
  }

  getCurrentLineRenderMode(): CurrentLineRenderMode {
    return this.currentLineRenderMode;
  }

  setAutoIndentMode(mode: AutoIndentMode): void {
    this.autoIndentMode = mode;
    this.editor?.applySettingsAutoIndentMode(mode);
  }

  getAutoIndentMode(): AutoIndentMode {
    return this.autoIndentMode;
  }

  setBackspaceUnindent(enabled: boolean): void {
    this.backspaceUnindent = enabled;
    this.editor?.applySettingsBackspaceUnindent(enabled);
  }

  isBackspaceUnindent(): boolean {
    return this.backspaceUnindent;
  }

  setReadOnly(readOnly: boolean): void {
    this.readOnly = readOnly;
    this.editor?.applySettingsReadOnly(readOnly);
  }

  isReadOnly(): boolean {
    return this.readOnly;
  }

  setCompositionEnabled(enabled: boolean): void {
    this.compositionEnabled = enabled;
    this.editor?.applySettingsCompositionEnabled(enabled);
  }

  isCompositionEnabled(): boolean {
    return this.compositionEnabled;
  }

  setMaxGutterIcons(count: number): void {
    this.maxGutterIcons = count;
    this.editor?.applySettingsMaxGutterIcons(count);
  }

  getMaxGutterIcons(): number {
    return this.maxGutterIcons;
  }

  setDecorationScrollRefreshMinIntervalMs(intervalMs: number): void {
    this.decorationScrollRefreshMinIntervalMs = Math.max(0, intervalMs);
    this.editor?.requestDecorationRefresh();
  }

  getDecorationScrollRefreshMinIntervalMs(): number {
    return this.decorationScrollRefreshMinIntervalMs;
  }

  setDecorationOverscanViewportMultiplier(multiplier: number): void {
    this.decorationOverscanViewportMultiplier = Math.max(0, multiplier);
    this.editor?.requestDecorationRefresh();
  }

  getDecorationOverscanViewportMultiplier(): number {
    return this.decorationOverscanViewportMultiplier;
  }

  private applyAll(): void {
    const editor = this.editor;
    if (!editor) {
      return;
    }
    editor.applySettingsTextSize(this.textSize);
    editor.applySettingsFontFamily(this.fontFamily);
    editor.applySettingsScale(this.scale);
    editor.applySettingsFoldArrowMode(this.foldArrowMode);
    editor.applySettingsWrapMode(this.wrapMode);
    editor.applySettingsLineSpacing(this.lineSpacingAdd, this.lineSpacingMult);
    editor.applySettingsContentStartPadding(this.contentStartPadding);
    editor.applySettingsShowSplitLine(this.showSplitLine);
    editor.applySettingsGutterSticky(this.gutterSticky);
    editor.applySettingsGutterVisible(this.gutterVisible);
    editor.applySettingsCurrentLineRenderMode(this.currentLineRenderMode);
    editor.applySettingsAutoIndentMode(this.autoIndentMode);
    editor.applySettingsBackspaceUnindent(this.backspaceUnindent);
    editor.applySettingsReadOnly(this.readOnly);
    editor.applySettingsCompositionEnabled(this.compositionEnabled);
    editor.applySettingsMaxGutterIcons(this.maxGutterIcons);
    editor.requestDecorationRefresh();
  }
}
