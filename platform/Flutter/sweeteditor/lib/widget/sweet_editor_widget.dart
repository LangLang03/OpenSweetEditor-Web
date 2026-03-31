part of '../sweeteditor.dart';

/// A Flutter widget that wraps the native SweetEditor engine.
///
/// Renders a full code editor with syntax highlighting, cursor, selection,
/// completion popup, inline suggestions, decorations, guides, and scrollbars.
///
/// Usage:
/// ```dart
/// final controller = SweetEditorController();
/// SweetEditorWidget(controller: controller);
/// controller.loadText('hello world');
/// ```
class SweetEditorWidget extends StatefulWidget {
  const SweetEditorWidget({
    super.key,
    required this.controller,
    this.theme,
    this.fontFamily = 'monospace',
    this.fontSize = 14,
    this.autofocus = true,
  });

  final SweetEditorController controller;
  final EditorTheme? theme;
  final String fontFamily;
  final double fontSize;
  final bool autofocus;

  @override
  State<SweetEditorWidget> createState() => _SweetEditorWidgetState();
}

class _SweetEditorWidgetState extends State<SweetEditorWidget>
    with TickerProviderStateMixin {
  core.EditorCore? _editorCore;
  core.Document? _document;
  core.EditorRenderModel _renderModel = core.EditorRenderModel.empty;
  late EditorTheme _theme;
  late EditorTextMeasurer _measurer;
  late EditorCanvasPainter _painter;
  late final EditorEventBus _eventBus = EditorEventBus();
  late EditorSettings _settings;
  late CompletionProviderManager _completionProviderManager;
  late CompletionPopupController _completionPopupController;
  late InlineSuggestionController _inlineSuggestionController;
  late DecorationProviderManager _decorationProviderManager;
  late NewLineActionProviderManager _newLineActionProviderManager;

  // Cursor blink
  Timer? _cursorBlinkTimer;
  bool _cursorVisible = true;

  // Animation (fling, edge scroll)
  Ticker? _animationTicker;
  bool _animating = false;

  // Viewport
  Size _viewportSize = Size.zero;
  bool _viewportReady = false;

  // Popup overlays
  EditorOverlayState<CompletionPopupOverlayState> _completionOverlay =
      const EditorOverlayState.hidden();

  // Inline suggestion bar overlay state
  EditorOverlayState<InlineSuggestionOverlayState> _inlineSuggestionOverlay =
      const EditorOverlayState.hidden();

  // Selection menu
  late SelectionMenuController _selectionMenuController;
  EditorOverlayState<SelectionMenuOverlayState> _selectionMenuOverlay =
      const EditorOverlayState.hidden();

  @override
  void initState() {
    super.initState();
    _theme = widget.theme ?? EditorTheme.dark();
    _initEditor();
  }

  @override
  void dispose() {
    _stopCursorBlink();
    _animationTicker?.stop();
    _animationTicker?.dispose();
    _selectionMenuController.dispose();
    _completionProviderManager.dispose();
    _decorationProviderManager.dispose();
    widget.controller._detach();
    _editorCore?.close();
    _document?.close();
    _painter.dispose();
    super.dispose();
  }

  void _initEditor() {
    _measurer = EditorTextMeasurer(
      fontFamily: widget.fontFamily,
      fontSize: widget.fontSize,
    );
    _painter = EditorCanvasPainter(theme: _theme, measurer: _measurer);

    final nativeMeasurer = _measurer.buildNativeMeasurer();
    _editorCore = core.EditorCore(measurer: nativeMeasurer);

    _settings = EditorSettings();
    _bindSettingsCallbacks();

    _registerTextStyles();
    _initSubsystems();
    _editorCore!.setHandleConfig(_computeHandleHitConfig());

    widget.controller._attach(this);
    _startCursorBlink();
  }

  void _bindSettingsCallbacks() {
    final ec = _editorCore;
    if (ec == null) return;
    _settings.applyTextSize = (size) {
      _measurer.updateFont(_measurer.fontFamily, size);
      ec.onFontMetricsChanged();
    };
    _settings.applyFontFamily = (family) {
      _measurer.updateFont(family, _measurer.fontSize);
      ec.onFontMetricsChanged();
    };
    _settings.applyScale = (scale) => ec.setScale(scale);
    _settings.applyFoldArrowMode = (mode) => ec.setFoldArrowMode(mode);
    _settings.applyWrapMode = (mode) => ec.setWrapMode(mode);
    _settings.applyLineSpacing = (add, mult) =>
        ec.setLineSpacing(add: add, mult: mult);
    _settings.applyContentStartPadding = (padding) =>
        ec.setContentStartPadding(padding);
    _settings.applyShowSplitLine = (show) => ec.setShowSplitLine(show);
    _settings.applyGutterSticky = (sticky) => ec.setGutterSticky(sticky);
    _settings.applyGutterVisible = (visible) => ec.setGutterVisible(visible);
    _settings.applyCurrentLineRenderMode = (mode) =>
        ec.setCurrentLineRenderMode(mode);
    _settings.applyAutoIndentMode = (mode) => ec.setAutoIndentMode(mode);
    _settings.applyReadOnly = (readOnly) => ec.setReadOnly(readOnly);
    _settings.applyMaxGutterIcons = (count) => ec.setMaxGutterIcons(count);
    _settings.requestDecorationRefresh = () =>
        _decorationProviderManager.requestRefresh();
    _settings.flushEditor = _flush;
  }

  void _registerTextStyles() {
    final ec = _editorCore;
    if (ec == null) return;
    for (final entry in _theme.textStyles.entries) {
      ec.registerTextStyle(
        entry.key,
        entry.value.color,
        backgroundColor: entry.value.backgroundColor,
        fontStyle: entry.value.fontStyle,
      );
    }
  }

  void _initSubsystems() {
    final ec = _editorCore!;

    _decorationProviderManager = DecorationProviderManager();
    _decorationProviderManager.getVisibleLineRange = () {
      final m = _renderModel;
      if (m.visualLines.isEmpty) return [0, -1];
      return [m.visualLines.first.logicalLine, m.visualLines.last.logicalLine];
    };
    _decorationProviderManager.getTotalLineCount = () =>
        _document?.lineCount ?? 0;
    _decorationProviderManager.getLanguageConfiguration = () =>
        widget.controller.languageConfiguration;
    _decorationProviderManager.getMetadata = () => widget.controller.metadata;
    _decorationProviderManager.clearHighlights = (layer) {
      ec.clearHighlightsLayer(core.SpanLayer.values[layer]);
    };
    _decorationProviderManager.setBatchLineSpans = (layer, spans) {
      final data = core.ProtocolEncoder.packBatchLineSpans(layer, spans);
      ec.setBatchLineSpans(data);
    };
    _decorationProviderManager.clearInlayHints = () => ec.clearInlayHints();
    _decorationProviderManager.setBatchLineInlayHints = (hints) {
      final data = core.ProtocolEncoder.packBatchLineInlayHints(hints);
      ec.setBatchLineInlayHints(data);
    };
    _decorationProviderManager.clearDiagnostics = () => ec.clearDiagnostics();
    _decorationProviderManager.setBatchLineDiagnostics = (items) {
      final data = core.ProtocolEncoder.packBatchLineDiagnostics(items);
      ec.setBatchLineDiagnostics(data);
    };
    _decorationProviderManager.clearGutterIcons = () => ec.clearGutterIcons();
    _decorationProviderManager.setBatchLineGutterIcons = (icons) {
      final data = core.ProtocolEncoder.packBatchLineGutterIcons(icons);
      ec.setBatchLineGutterIcons(data);
    };
    _decorationProviderManager.clearPhantomTexts = () => ec.clearPhantomTexts();
    _decorationProviderManager.setBatchLinePhantomTexts = (texts) {
      final data = core.ProtocolEncoder.packBatchLinePhantomTexts(texts);
      ec.setBatchLinePhantomTexts(data);
    };
    _decorationProviderManager.setIndentGuides = (guides) {
      final data = core.ProtocolEncoder.packIndentGuides(guides);
      ec.setIndentGuides(data);
    };
    _decorationProviderManager.setBracketGuides = (guides) {
      final data = core.ProtocolEncoder.packBracketGuides(guides);
      ec.setBracketGuides(data);
    };
    _decorationProviderManager.setFlowGuides = (guides) {
      final data = core.ProtocolEncoder.packFlowGuides(guides);
      ec.setFlowGuides(data);
    };
    _decorationProviderManager.setSeparatorGuides = (guides) {
      final data = core.ProtocolEncoder.packSeparatorGuides(guides);
      ec.setSeparatorGuides(data);
    };
    _decorationProviderManager.setFoldRegions = (regions) {
      final data = core.ProtocolEncoder.packFoldRegions(regions);
      ec.setFoldRegions(data);
    };
    _decorationProviderManager.flush = _flush;
    _decorationProviderManager.getDecorationScrollRefreshMinIntervalMs = () =>
        _settings.getDecorationScrollRefreshMinIntervalMs();
    _decorationProviderManager.getDecorationOverscanViewportMultiplier = () =>
        _settings.getDecorationOverscanViewportMultiplier();

    _completionProviderManager = CompletionProviderManager();
    _completionProviderManager.getCursorPosition = () => ec.getCursorPosition();
    _completionProviderManager.getLineText = (line) =>
        _document?.getLineText(line) ?? '';
    _completionProviderManager.getWordRangeAtCursor = () {
      final pos = ec.getCursorPosition();
      return core.TextRange(pos, pos);
    };
    _completionProviderManager.getLanguageConfiguration = () =>
        widget.controller.languageConfiguration;
    _completionProviderManager.getMetadata = () => widget.controller.metadata;

    _completionPopupController = CompletionPopupController(
      panelBgColor: _theme.completionBgColor,
      panelBorderColor: _theme.completionBorderColor,
      selectedBgColor: _theme.completionSelectedBgColor,
      labelColor: _theme.completionLabelColor,
      detailColor: _theme.completionDetailColor,
    );
    _completionPopupController.setConfirmHandler(_onCompletionItemConfirmed);
    _completionPopupController.bindOverlay(
      _createOverlayBinding<CompletionPopupOverlayState>(
        (overlay) => _completionOverlay = overlay,
      ),
    );

    _completionProviderManager.setListener(_completionPopupController);

    _inlineSuggestionController = InlineSuggestionController(
      eventBus: _eventBus,
    );
    _inlineSuggestionController.clearPhantomTexts = () =>
        ec.clearPhantomTexts();
    _inlineSuggestionController.setBatchLinePhantomTexts = (phantoms) {
      final data = core.ProtocolEncoder.packBatchLinePhantomTexts(phantoms);
      ec.setBatchLinePhantomTexts(data);
    };
    _inlineSuggestionController.replaceText = (range, text) {
      ec.replaceText(
        range.start.line,
        range.start.column,
        range.end.line,
        range.end.column,
        text,
      );
    };
    _inlineSuggestionController.getPositionRect = (line, column) {
      return core.PointF(
        x: _renderModel.cursor.position.x,
        y: _renderModel.cursor.position.y,
      );
    };
    _inlineSuggestionController.flush = _flush;
    _inlineSuggestionController.bindOverlay(
      _createOverlayBinding<InlineSuggestionOverlayState>(
        (overlay) => _inlineSuggestionOverlay = overlay,
      ),
    );

    _newLineActionProviderManager = NewLineActionProviderManager();

    _selectionMenuController = SelectionMenuController();
    _selectionMenuController.buildContext = _buildSelectionMenuContext;
    _selectionMenuController.bindOverlay(
      _createOverlayBinding<SelectionMenuOverlayState>(
        (overlay) => _selectionMenuOverlay = overlay,
      ),
    );
  }

  static core.HandleConfig _computeHandleHitConfig() {
    const double r = 10.0; // drop radius (logical px)
    const double d = 24.0; // center distance
    const double angle = 45.0 * math.pi / 180.0;
    final cos = math.cos(angle);
    final sin = math.sin(angle);

    final points = <List<double>>[
      [0, 0],
      [-r, d],
      [r, d],
      [0, d + r],
      [0, d - r * 0.8],
    ];

    var minX = double.infinity, minY = double.infinity;
    var maxX = double.negativeInfinity, maxY = double.negativeInfinity;
    for (final p in points) {
      final rx = p[0] * cos - p[1] * sin;
      final ry = p[0] * sin + p[1] * cos;
      minX = math.min(minX, rx);
      minY = math.min(minY, ry);
      maxX = math.max(maxX, rx);
      maxY = math.max(maxY, ry);
    }

    const pad = 8.0;
    return core.HandleConfig(
      startLeft: minX - pad,
      startTop: minY - pad,
      startRight: maxX + pad,
      startBottom: maxY + pad,
      endLeft: -maxX - pad,
      endTop: minY - pad,
      endRight: -minX + pad,
      endBottom: maxY + pad,
    );
  }

  Offset _computeSelectionMenuPosition(Size viewportSize) {
    final m = _renderModel;
    final sx = m.scrollX;
    final sy = m.scrollY;
    final start = m.selectionStartHandle;
    final end = m.selectionEndHandle;

    double anchorX, topY, bottomY;
    if (start.visible) {
      final startX = start.position.x - sx;
      final startY = start.position.y - sy;
      final startBottom = startY + start.height;
      final endX = end.visible ? end.position.x - sx : startX;
      final endY = end.visible ? end.position.y - sy : startY;
      final endBottom = end.visible ? endY + end.height : startBottom;
      anchorX = (startX + endX) * 0.5;
      topY = math.min(startY, endY);
      bottomY = math.max(startBottom, endBottom);
    } else {
      anchorX = viewportSize.width * 0.5;
      topY = 0;
      bottomY = 0;
    }

    const menuWidth = 240.0;
    const menuHeight = 36.0;
    const offsetY = 8.0;
    const handleClearance = 32.0;

    final x = (anchorX - menuWidth / 2)
        .clamp(0.0, math.max(0.0, viewportSize.width - menuWidth))
        .toDouble();
    final aboveY = topY - menuHeight - offsetY;
    final belowY = bottomY + offsetY + handleClearance;
    final y = (aboveY >= 0 ? aboveY : belowY)
        .clamp(0.0, math.max(0.0, viewportSize.height - menuHeight))
        .toDouble();
    return Offset(x, y);
  }

  void _loadText(String text) {
    _document?.close();
    _document = core.Document.fromString(text);
    _editorCore?.setDocument(_document!);
    _decorationProviderManager.onDocumentLoaded();
    _eventBus.publish(DocumentLoadedEvent());
    _flush();
  }

  String _getContent() => _document?.text ?? '';

  void _flush() {
    if (_editorCore == null || !mounted || !_viewportReady) return;
    _renderModel = _editorCore!.buildRenderModel();
    _painter.updateModel(_renderModel, _cursorVisible);

    // Update completion popup cursor position
    if (_completionPopupController.isShowing && _renderModel.cursor.visible) {
      _completionPopupController.updateCursorPosition(
        _renderModel.cursor.position.x - _renderModel.scrollX,
        _renderModel.cursor.position.y - _renderModel.scrollY,
        _renderModel.cursor.height,
      );
    }

    // Update inline suggestion position
    if (_inlineSuggestionController.isShowing && _renderModel.cursor.visible) {
      _inlineSuggestionController.updatePosition(
        _renderModel.cursor.position.x - _renderModel.scrollX,
        _renderModel.cursor.position.y - _renderModel.scrollY,
        _renderModel.cursor.height,
      );
    }
  }

  void _applyTheme(EditorTheme theme) {
    _theme = theme;
    _painter.updateTheme(theme);
    _completionPopupController.applyTheme(
      theme.completionBgColor,
      theme.completionBorderColor,
      theme.completionSelectedBgColor,
      theme.completionLabelColor,
      theme.completionDetailColor,
    );
    _registerTextStyles();
    _flush();
  }

  void _onPointerDown(PointerDownEvent event) {
    final isTouch = event.kind == PointerDeviceKind.touch;
    final gestureEvent = core.GestureEvent(
      type: isTouch ? core.EventType.touchDown : core.EventType.mouseDown,
      points: [
        core.PointF(x: event.localPosition.dx, y: event.localPosition.dy),
      ],
    );
    _processGestureResult(_editorCore?.handleGestureEvent(gestureEvent));
  }

  void _onPointerMove(PointerMoveEvent event) {
    final isTouch = event.kind == PointerDeviceKind.touch;
    final gestureEvent = core.GestureEvent(
      type: isTouch ? core.EventType.touchMove : core.EventType.mouseMove,
      points: [
        core.PointF(x: event.localPosition.dx, y: event.localPosition.dy),
      ],
    );
    _processGestureResult(_editorCore?.handleGestureEvent(gestureEvent));
  }

  void _onPointerUp(PointerUpEvent event) {
    final isTouch = event.kind == PointerDeviceKind.touch;
    final gestureEvent = core.GestureEvent(
      type: isTouch ? core.EventType.touchUp : core.EventType.mouseUp,
      points: [
        core.PointF(x: event.localPosition.dx, y: event.localPosition.dy),
      ],
    );
    _processGestureResult(_editorCore?.handleGestureEvent(gestureEvent));
  }

  void _onPointerSignal(PointerSignalEvent event) {
    if (event is PointerScrollEvent) {
      final gestureEvent = core.GestureEvent(
        type: core.EventType.mouseWheel,
        points: [
          core.PointF(x: event.localPosition.dx, y: event.localPosition.dy),
        ],
        wheelDeltaX: event.scrollDelta.dx,
        wheelDeltaY: event.scrollDelta.dy,
      );
      _processGestureResult(_editorCore?.handleGestureEvent(gestureEvent));
    }
  }

  void _processGestureResult(core.GestureResult? result) {
    if (result == null) return;
    _fireGestureEvents(result);
    _flush();
    _selectionMenuController.onGestureResult(result, result.hasSelection);
    _updateAnimationState(result);
    _resetCursorBlink();
  }

  SelectionMenuContext _buildSelectionMenuContext(bool hasSelection) {
    final cursorPosition =
        _editorCore?.getCursorPosition() ?? const core.TextPosition(0, 0);
    return SelectionMenuContext(
      hasSelection: hasSelection,
      cursorPosition: cursorPosition,
      selection: _editorCore?.getSelection(),
      selectedText: _editorCore?.getSelectedText() ?? '',
    );
  }

  EditorOverlayBinding<T> _createOverlayBinding<T>(
    void Function(EditorOverlayState<T> overlay) assign,
  ) {
    void updateOverlay(T? data) {
      if (!mounted) return;
      setState(() {
        assign(
          data == null
              ? EditorOverlayState<T>.hidden()
              : EditorOverlayState<T>.visible(data),
        );
      });
    }

    return EditorOverlayBinding<T>(
      show: (data) => updateOverlay(data),
      update: (data) => updateOverlay(data),
      hide: () => updateOverlay(null),
    );
  }

  void _fireGestureEvents(core.GestureResult result) {
    final pos = result.cursorPosition;
    switch (result.type) {
      case core.GestureType.tap:
        _eventBus.publish(CursorChangedEvent(cursorPosition: pos));
      case core.GestureType.doubleTap:
        _eventBus.publish(
          DoubleTapEvent(
            cursorPosition: pos,
            hasSelection: result.hasSelection,
            selection: result.hasSelection ? result.selection : null,
            screenPoint: result.tapPoint,
          ),
        );
        _eventBus.publish(CursorChangedEvent(cursorPosition: pos));
        if (result.hasSelection) {
          _eventBus.publish(
            SelectionChangedEvent(
              hasSelection: true,
              selection: result.selection,
              cursorPosition: pos,
            ),
          );
        }
      case core.GestureType.longPress:
        _eventBus.publish(
          LongPressEvent(cursorPosition: pos, screenPoint: result.tapPoint),
        );
        _eventBus.publish(CursorChangedEvent(cursorPosition: pos));
      case core.GestureType.scroll:
        _eventBus.publish(
          ScrollChangedEvent(
            scrollX: result.viewScrollX,
            scrollY: result.viewScrollY,
          ),
        );
        _decorationProviderManager.onScrollChanged();
      case core.GestureType.scale:
        _eventBus.publish(ScaleChangedEvent(scale: result.viewScale));
      case core.GestureType.dragSelect:
        if (result.hasSelection) {
          _eventBus.publish(
            SelectionChangedEvent(
              hasSelection: true,
              selection: result.selection,
              cursorPosition: pos,
            ),
          );
        }
      default:
        break;
    }
  }

  KeyEventResult _handleKeyEvent(FocusNode node, KeyEvent event) {
    if (_editorCore == null || event is! KeyDownEvent) {
      return KeyEventResult.ignored;
    }

    final logicalKey = event.logicalKey;
    int modifiers = core.Modifier.none;
    if (HardwareKeyboard.instance.isShiftPressed) {
      modifiers |= core.Modifier.shift;
    }
    if (HardwareKeyboard.instance.isControlPressed) {
      modifiers |= core.Modifier.ctrl;
    }
    if (HardwareKeyboard.instance.isAltPressed) modifiers |= core.Modifier.alt;
    if (HardwareKeyboard.instance.isMetaPressed) {
      modifiers |= core.Modifier.meta;
    }

    // Map logical key to our KeyCode
    var keyCode = _mapLogicalKey(logicalKey);
    String? text;

    // Fallback to character
    if (keyCode == core.KeyCode.none &&
        event.character != null &&
        event.character!.isNotEmpty) {
      if (modifiers & core.Modifier.ctrl != 0 ||
          modifiers & core.Modifier.meta != 0) {
        keyCode = _mapCtrlChar(event.character!);
      } else {
        text = event.character;
      }
    }

    if (keyCode == core.KeyCode.none && text == null) {
      return KeyEventResult.ignored;
    }

    if (_inlineSuggestionController.isShowing) {
      final androidCode = keyCode.value;
      if (androidCode != 0 &&
          _inlineSuggestionController.handleKeyCode(androidCode)) {
        _flush();
        return KeyEventResult.handled;
      }
    }

    if (_completionPopupController.isShowing) {
      final androidCode = keyCode.value;
      if (androidCode != 0 &&
          _completionPopupController.handleKeyCode(androidCode)) {
        return KeyEventResult.handled;
      }
    }

    if (modifiers & (core.Modifier.ctrl | core.Modifier.meta) != 0) {
      if (_handleCtrlShortcut(keyCode, modifiers)) {
        _resetCursorBlink();
        _flush();
        return KeyEventResult.handled;
      }
    }

    if (keyCode == core.KeyCode.enter && _tryHandleNewLineAction()) {
      _resetCursorBlink();
      _flush();
      return KeyEventResult.handled;
    }

    final result = _editorCore!.handleKeyEvent(
      keyCode,
      text: text,
      modifiers: modifiers,
    );
    _dispatchKeyEventResult(result, text);
    _resetCursorBlink();
    _flush();

    return result.handled ? KeyEventResult.handled : KeyEventResult.ignored;
  }

  bool _handleCtrlShortcut(core.KeyCode keyCode, int modifiers) {
    switch (keyCode) {
      case core.KeyCode.z:
        if (modifiers & core.Modifier.shift != 0) {
          _editorCore!.redo();
        } else {
          _editorCore!.undo();
        }
        return true;
      case core.KeyCode.y:
        _editorCore!.redo();
        return true;
      case core.KeyCode.a:
        _editorCore!.selectAll();
        return true;
      case core.KeyCode.c:
        _copyToClipboard();
        return true;
      case core.KeyCode.x:
        _cutToClipboard();
        return true;
      case core.KeyCode.v:
        _pasteFromClipboard();
        return true;
      default:
        return false;
    }
  }

  void _copyToClipboard() {
    final text = _editorCore?.getSelectedText() ?? '';
    if (text.isNotEmpty) {
      Clipboard.setData(ClipboardData(text: text));
    }
  }

  void _cutToClipboard() {
    final text = _editorCore?.getSelectedText() ?? '';
    if (text.isNotEmpty) {
      Clipboard.setData(ClipboardData(text: text));
      _editorCore?.backspace();
    }
  }

  void _pasteFromClipboard() {
    Clipboard.getData(Clipboard.kTextPlain).then((data) {
      if (data?.text != null && data!.text!.isNotEmpty && mounted) {
        _editorCore?.insertText(data.text!);
        _flush();
      }
    });
  }

  void _onSelectionMenuItemTap(SelectionMenuItem item) {
    switch (item.id) {
      case SelectionMenuItem.actionCut:
        _cutToClipboard();
        _selectionMenuController.hide();
      case SelectionMenuItem.actionCopy:
        _copyToClipboard();
        _selectionMenuController.hide();
      case SelectionMenuItem.actionPaste:
        _pasteFromClipboard();
        _selectionMenuController.hide();
      case SelectionMenuItem.actionSelectAll:
        _editorCore?.selectAll();
        _flush();
      default:
        _eventBus.publish(
          SelectionMenuItemClickEvent(itemId: item.id, itemLabel: item.label),
        );
        _selectionMenuController.hide();
    }
  }

  bool _tryHandleNewLineAction() {
    final pos = _editorCore?.getCursorPosition();
    if (pos == null) return false;
    final lineText = _document?.getLineText(pos.line) ?? '';
    final action = _newLineActionProviderManager.provideNewLineAction(
      pos.line,
      pos.column,
      lineText,
      widget.controller.languageConfiguration,
      widget.controller.metadata,
    );
    if (action != null) {
      _editorCore?.insertText(action.text);
      return true;
    }
    return false;
  }

  void _dispatchKeyEventResult(core.KeyEventResult result, String? typedText) {
    if (result.contentChanged) {
      final changes = result.editResult?.changes ?? [];
      for (final change in changes) {
        _eventBus.publish(
          TextChangedEvent(
            action: TextChangeAction.key,
            changeRange: change.range,
            text: change.newText,
          ),
        );
      }
      if (changes.isNotEmpty) {
        _decorationProviderManager.onTextChanged(changes);
      }
      // Check completion trigger
      if (typedText != null &&
          _completionProviderManager.isTriggerCharacter(typedText)) {
        _completionProviderManager.triggerCompletion(
          CompletionTriggerKind.character,
          typedText,
        );
      }
    }
    if (result.cursorChanged) {
      final pos =
          _editorCore?.getCursorPosition() ?? const core.TextPosition(0, 0);
      _eventBus.publish(CursorChangedEvent(cursorPosition: pos));
    }
    if (result.selectionChanged) {
      final sel = _editorCore?.getSelection();
      final pos =
          _editorCore?.getCursorPosition() ?? const core.TextPosition(0, 0);
      _eventBus.publish(
        SelectionChangedEvent(
          hasSelection: sel != null,
          selection: sel,
          cursorPosition: pos,
        ),
      );
    }
  }

  void _onCompletionItemConfirmed(CompletionItem item) {
    if (item.textEdit != null) {
      final edit = item.textEdit!;
      _editorCore?.replaceText(
        edit.range.start.line,
        edit.range.start.column,
        edit.range.end.line,
        edit.range.end.column,
        edit.newText,
      );
    } else {
      _editorCore?.insertText(item.insertText ?? item.label);
    }
    _flush();
  }

  void _startCursorBlink() {
    _stopCursorBlink();
    _cursorVisible = true;
    _cursorBlinkTimer = Timer.periodic(const Duration(milliseconds: 500), (_) {
      _cursorVisible = !_cursorVisible;
      _painter.updateCursorVisible(_cursorVisible);
    });
  }

  void _resetCursorBlink() {
    _cursorVisible = true;
    _painter.updateCursorVisible(true);
    _stopCursorBlink();
    _startCursorBlink();
  }

  void _stopCursorBlink() {
    _cursorBlinkTimer?.cancel();
    _cursorBlinkTimer = null;
  }

  void _updateAnimationState(core.GestureResult result) {
    if (result.needsAnimation && !_animating) {
      _animating = true;
      _animationTicker ??= createTicker(_onAnimationTick);
      _animationTicker!.start();
    } else if (!result.needsAnimation && _animating) {
      _animating = false;
      _animationTicker?.stop();
    }
  }

  void _onAnimationTick(Duration elapsed) {
    if (_editorCore == null || !_animating) return;
    final result = _editorCore!.tickAnimations();
    _flush();
    if (!result.needsAnimation) {
      _animating = false;
      _animationTicker?.stop();
    }
  }

  static core.KeyCode _mapLogicalKey(LogicalKeyboardKey key) {
    if (key == LogicalKeyboardKey.backspace) return core.KeyCode.backspace;
    if (key == LogicalKeyboardKey.delete) return core.KeyCode.deleteKey;
    if (key == LogicalKeyboardKey.enter) return core.KeyCode.enter;
    if (key == LogicalKeyboardKey.tab) return core.KeyCode.tab;
    if (key == LogicalKeyboardKey.escape) return core.KeyCode.escape;
    if (key == LogicalKeyboardKey.arrowLeft) return core.KeyCode.left;
    if (key == LogicalKeyboardKey.arrowRight) return core.KeyCode.right;
    if (key == LogicalKeyboardKey.arrowUp) return core.KeyCode.up;
    if (key == LogicalKeyboardKey.arrowDown) return core.KeyCode.down;
    if (key == LogicalKeyboardKey.home) return core.KeyCode.home;
    if (key == LogicalKeyboardKey.end) return core.KeyCode.end;
    if (key == LogicalKeyboardKey.pageUp) return core.KeyCode.pageUp;
    if (key == LogicalKeyboardKey.pageDown) return core.KeyCode.pageDown;
    return core.KeyCode.none;
  }

  static core.KeyCode _mapCtrlChar(String ch) {
    switch (ch.toUpperCase()) {
      case 'Z':
        return core.KeyCode.z;
      case 'Y':
        return core.KeyCode.y;
      case 'A':
        return core.KeyCode.a;
      case 'C':
        return core.KeyCode.c;
      case 'X':
        return core.KeyCode.x;
      case 'V':
        return core.KeyCode.v;
      case 'K':
        return core.KeyCode.k;
      default:
        return core.KeyCode.none;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Focus(
      autofocus: widget.autofocus,
      onKeyEvent: _handleKeyEvent,
      child: Listener(
        onPointerDown: _onPointerDown,
        onPointerMove: _onPointerMove,
        onPointerUp: _onPointerUp,
        onPointerSignal: _onPointerSignal,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final newSize = constraints.biggest;
            if (newSize != _viewportSize &&
                newSize.width > 0 &&
                newSize.height > 0) {
              _viewportSize = newSize;
              WidgetsBinding.instance.addPostFrameCallback((_) {
                _editorCore?.setViewport(
                  newSize.width.toInt(),
                  newSize.height.toInt(),
                );
                _viewportReady = true;
                _flush();
              });
            }

            final completionOverlay = _completionOverlay.data;
            final inlineSuggestionOverlay = _inlineSuggestionOverlay.data;
            final selectionMenuOverlay = _selectionMenuOverlay.data;

            return Stack(
              children: [
                // Editor canvas
                CustomPaint(size: newSize, painter: _painter),

                // Completion popup overlay
                if (completionOverlay != null)
                  CompletionPopupWidget(
                    items: completionOverlay.items,
                    selectedIndex: completionOverlay.selectedIndex,
                    position: completionOverlay.position,
                    themeColors: _completionPopupController.themeColors,
                    viewportSize: newSize,
                    onItemTap: (index) =>
                        _completionPopupController.confirmItem(index),
                  ),

                // Inline suggestion bar overlay
                if (inlineSuggestionOverlay != null)
                  InlineSuggestionBarWidget(
                    x: inlineSuggestionOverlay.x,
                    y: inlineSuggestionOverlay.y,
                    cursorHeight: inlineSuggestionOverlay.cursorHeight,
                    theme: _theme,
                    onAccept: () => _inlineSuggestionController.accept(),
                    onDismiss: () => _inlineSuggestionController.dismiss(),
                  ),

                // Selection context menu
                if (selectionMenuOverlay != null &&
                    selectionMenuOverlay.items.isNotEmpty)
                  SelectionMenuWidget(
                    position: _computeSelectionMenuPosition(newSize),
                    items: selectionMenuOverlay.items,
                    bgColor: _theme.completionBgColor,
                    textColor: _theme.completionLabelColor,
                    onItemTap: _onSelectionMenuItemTap,
                  ),
              ],
            );
          },
        ),
      ),
    );
  }
}
