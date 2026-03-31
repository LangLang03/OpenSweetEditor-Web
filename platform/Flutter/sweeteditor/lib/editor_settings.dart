import 'editor_core.dart' as core;

/// Settings wrapper for the editor, mirroring OHOS EditorSettings.
class EditorSettings {
  EditorSettings();

  double _textSize = 28;
  String _fontFamily = 'monospace';
  double _scale = 1.0;
  core.FoldArrowMode _foldArrowMode = core.FoldArrowMode.always;
  core.WrapMode _wrapMode = core.WrapMode.none;
  double _lineSpacingAdd = 0;
  double _lineSpacingMult = 1.0;
  double _contentStartPadding = 0;
  bool _showSplitLine = true;
  bool _gutterSticky = true;
  bool _gutterVisible = true;
  core.CurrentLineRenderMode _currentLineRenderMode =
      core.CurrentLineRenderMode.background;
  core.AutoIndentMode _autoIndentMode = core.AutoIndentMode.none;
  bool _readOnly = false;
  int _maxGutterIcons = 0;
  int _decorationScrollRefreshMinIntervalMs = 16;
  double _decorationOverscanViewportMultiplier = 1.5;

  // Callbacks set by the editor integration
  void Function(double size)? applyTextSize;
  void Function(String fontFamily)? applyFontFamily;
  void Function(double scale)? applyScale;
  void Function(core.FoldArrowMode mode)? applyFoldArrowMode;
  void Function(core.WrapMode mode)? applyWrapMode;
  void Function(double add, double mult)? applyLineSpacing;
  void Function(double padding)? applyContentStartPadding;
  void Function(bool show)? applyShowSplitLine;
  void Function(bool sticky)? applyGutterSticky;
  void Function(bool visible)? applyGutterVisible;
  void Function(core.CurrentLineRenderMode mode)? applyCurrentLineRenderMode;
  void Function(core.AutoIndentMode mode)? applyAutoIndentMode;
  void Function(bool readOnly)? applyReadOnly;
  void Function(int count)? applyMaxGutterIcons;
  void Function()? requestDecorationRefresh;
  void Function()? flushEditor;

  void setEditorTextSize(double size) {
    _textSize = size;
    applyTextSize?.call(size);
  }

  double getEditorTextSize() => _textSize;

  void setFontFamily(String fontFamily) {
    _fontFamily = fontFamily;
    applyFontFamily?.call(fontFamily);
  }

  String getFontFamily() => _fontFamily;

  void setScale(double scale) {
    _scale = scale;
    applyScale?.call(scale);
  }

  double getScale() => _scale;

  void setFoldArrowMode(core.FoldArrowMode mode) {
    _foldArrowMode = mode;
    applyFoldArrowMode?.call(mode);
  }

  core.FoldArrowMode getFoldArrowMode() => _foldArrowMode;

  void setWrapMode(core.WrapMode mode) {
    _wrapMode = mode;
    applyWrapMode?.call(mode);
    flushEditor?.call();
  }

  core.WrapMode getWrapMode() => _wrapMode;

  void setLineSpacing(double add, double mult) {
    _lineSpacingAdd = add;
    _lineSpacingMult = mult;
    applyLineSpacing?.call(add, mult);
    flushEditor?.call();
  }

  double getLineSpacingAdd() => _lineSpacingAdd;
  double getLineSpacingMult() => _lineSpacingMult;

  void setContentStartPadding(double padding) {
    _contentStartPadding = padding.clamp(0, double.infinity);
    applyContentStartPadding?.call(_contentStartPadding);
    flushEditor?.call();
  }

  double getContentStartPadding() => _contentStartPadding;

  void setShowSplitLine(bool show) {
    _showSplitLine = show;
    applyShowSplitLine?.call(show);
    flushEditor?.call();
  }

  bool isShowSplitLine() => _showSplitLine;

  void setGutterSticky(bool sticky) {
    _gutterSticky = sticky;
    applyGutterSticky?.call(sticky);
    flushEditor?.call();
  }

  bool isGutterSticky() => _gutterSticky;

  void setGutterVisible(bool visible) {
    _gutterVisible = visible;
    applyGutterVisible?.call(visible);
    flushEditor?.call();
  }

  bool isGutterVisible() => _gutterVisible;

  void setCurrentLineRenderMode(core.CurrentLineRenderMode mode) {
    _currentLineRenderMode = mode;
    applyCurrentLineRenderMode?.call(mode);
    flushEditor?.call();
  }

  core.CurrentLineRenderMode getCurrentLineRenderMode() =>
      _currentLineRenderMode;

  void setAutoIndentMode(core.AutoIndentMode mode) {
    _autoIndentMode = mode;
    applyAutoIndentMode?.call(mode);
  }

  core.AutoIndentMode getAutoIndentMode() => _autoIndentMode;

  void setReadOnly(bool readOnly) {
    _readOnly = readOnly;
    applyReadOnly?.call(readOnly);
  }

  bool isReadOnly() => _readOnly;

  void setMaxGutterIcons(int count) {
    _maxGutterIcons = count;
    applyMaxGutterIcons?.call(count);
  }

  int getMaxGutterIcons() => _maxGutterIcons;

  void setDecorationScrollRefreshMinIntervalMs(int intervalMs) {
    _decorationScrollRefreshMinIntervalMs = intervalMs.clamp(0, 1 << 30);
    requestDecorationRefresh?.call();
  }

  int getDecorationScrollRefreshMinIntervalMs() =>
      _decorationScrollRefreshMinIntervalMs;

  void setDecorationOverscanViewportMultiplier(double multiplier) {
    _decorationOverscanViewportMultiplier = multiplier.clamp(
      0,
      double.infinity,
    );
    requestDecorationRefresh?.call();
  }

  double getDecorationOverscanViewportMultiplier() =>
      _decorationOverscanViewportMultiplier;
}
