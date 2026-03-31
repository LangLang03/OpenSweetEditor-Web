import '../editor_core.dart' as core;
import '../event/editor_event.dart';
import '../event/editor_event_bus.dart';
import '../overlay/editor_overlay.dart';

import 'inline_suggestion_types.dart';

/// Callback for inline suggestion action bar Accept/Dismiss interaction.
abstract class InlineSuggestionActionCallback {
  void onAcceptClicked();
  void onDismissClicked();
}

class InlineSuggestionOverlayState {
  const InlineSuggestionOverlayState({
    required this.x,
    required this.y,
    required this.cursorHeight,
  });

  final double x;
  final double y;
  final double cursorHeight;
}

/// Manages inline suggestion lifecycle: phantom text injection, event subscriptions,
/// Tab/Esc key interception, and action bar state.
class InlineSuggestionController implements InlineSuggestionActionCallback {
  InlineSuggestionController({required this.eventBus});

  final EditorEventBus eventBus;

  InlineSuggestion? _currentSuggestion;
  InlineSuggestionListener? _listener;
  bool _showing = false;
  bool _suppressAutoDismiss = false;
  double _cachedCursorX = 0;
  double _cachedCursorY = 0;
  double _cachedCursorHeight = 0;
  EditorOverlayBinding<InlineSuggestionOverlayState>? _overlayBinding;

  // These will be set by the SweetEditor when integrated
  void Function()? clearPhantomTexts;
  void Function(Map<int, List<core.PhantomText>> phantoms)?
  setBatchLinePhantomTexts;
  void Function(core.TextRange range, String text)? replaceText;
  core.PointF Function(int line, int column)? getPositionRect;
  void Function()? flush;

  void _onTextChanged(TextChangedEvent _) => _autoDismiss();

  void _onCursorChanged(CursorChangedEvent _) => _autoDismiss();

  void _onScrollChanged(ScrollChangedEvent _) {
    if (_showing) {
      _overlayBinding?.update(_buildOverlayState());
    }
  }

  void setListener(InlineSuggestionListener? listener) {
    _listener = listener;
  }

  void bindOverlay(
    EditorOverlayBinding<InlineSuggestionOverlayState>? binding,
  ) {
    _overlayBinding = binding;
  }

  bool get isShowing => _showing;

  void show(InlineSuggestion suggestion) {
    if (_showing) _clearQuietly();
    _currentSuggestion = suggestion;
    _injectPhantomText(suggestion);

    final rect = getPositionRect?.call(suggestion.line, suggestion.column);
    _cachedCursorX = rect?.x ?? 0;
    _cachedCursorY = rect?.y ?? 0;
    _cachedCursorHeight = 0;

    _showing = true;
    _overlayBinding?.show(_buildOverlayState());
    _subscribeEvents();
    flush?.call();
  }

  void accept() {
    if (_currentSuggestion == null) return;
    final suggestion = _currentSuggestion!;
    _withSuppressedAutoDismiss(() {
      _unsubscribeEvents();
      clearPhantomTexts?.call();
      final pos = core.TextPosition(suggestion.line, suggestion.column);
      replaceText?.call(core.TextRange(pos, pos), suggestion.text);
      _showing = false;
      _overlayBinding?.hide();
      _currentSuggestion = null;
    });
    _listener?.onSuggestionAccepted(suggestion);
  }

  void dismiss() {
    if (_currentSuggestion == null) return;
    final suggestion = _currentSuggestion!;
    _withSuppressedAutoDismiss(() {
      _unsubscribeEvents();
      clearPhantomTexts?.call();
      flush?.call();
      _showing = false;
      _overlayBinding?.hide();
      _currentSuggestion = null;
    });
    _listener?.onSuggestionDismissed(suggestion);
  }

  /// Handle key codes. Returns true if consumed.
  /// Tab -> accept, Escape -> dismiss.
  bool handleKeyCode(int keyCode) {
    if (!_showing) return false;
    if (keyCode == 9) {
      // Tab
      accept();
      return true;
    }
    if (keyCode == 27) {
      // Escape
      dismiss();
      return true;
    }
    return false;
  }

  void updatePosition(double cursorX, double cursorY, double cursorHeight) {
    _cachedCursorX = cursorX;
    _cachedCursorY = cursorY;
    _cachedCursorHeight = cursorHeight;
    if (_showing) {
      _overlayBinding?.update(_buildOverlayState());
    }
  }

  @override
  void onAcceptClicked() => accept();

  @override
  void onDismissClicked() => dismiss();

  void _autoDismiss() {
    if (_suppressAutoDismiss) return;
    dismiss();
  }

  void _clearQuietly() {
    _withSuppressedAutoDismiss(() {
      _unsubscribeEvents();
      clearPhantomTexts?.call();
      _showing = false;
      _overlayBinding?.hide();
      _currentSuggestion = null;
    });
  }

  void _withSuppressedAutoDismiss(void Function() action) {
    _suppressAutoDismiss = true;
    try {
      action();
    } finally {
      _suppressAutoDismiss = false;
    }
  }

  void _injectPhantomText(InlineSuggestion suggestion) {
    clearPhantomTexts?.call();
    setBatchLinePhantomTexts?.call({
      suggestion.line: [
        core.PhantomText(column: suggestion.column, text: suggestion.text),
      ],
    });
  }

  InlineSuggestionOverlayState _buildOverlayState() {
    return InlineSuggestionOverlayState(
      x: _cachedCursorX,
      y: _cachedCursorY,
      cursorHeight: _cachedCursorHeight,
    );
  }

  void _subscribeEvents() {
    eventBus.subscribe<TextChangedEvent>(_onTextChanged);
    eventBus.subscribe<CursorChangedEvent>(_onCursorChanged);
    eventBus.subscribe<ScrollChangedEvent>(_onScrollChanged);
  }

  void _unsubscribeEvents() {
    eventBus.unsubscribe<TextChangedEvent>(_onTextChanged);
    eventBus.unsubscribe<CursorChangedEvent>(_onCursorChanged);
    eventBus.unsubscribe<ScrollChangedEvent>(_onScrollChanged);
  }
}
