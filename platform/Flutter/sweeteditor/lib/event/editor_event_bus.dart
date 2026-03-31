import 'editor_event.dart';

typedef _UntypedEditorEventListener = void Function(EditorEvent event);

/// Generic editor event bus.
/// Dispatches by event type, each event type has its own subscriber list.
class EditorEventBus {
  final Map<Type, List<_UntypedEditorEventListener>> _listeners = {};

  void subscribe<T extends EditorEvent>(EditorEventListener<T> listener) {
    final list = _listeners.putIfAbsent(T, () => []);
    final cast = listener as _UntypedEditorEventListener;
    if (!list.contains(cast)) {
      list.add(cast);
    }
  }

  void unsubscribe<T extends EditorEvent>(EditorEventListener<T> listener) {
    final list = _listeners[T];
    if (list == null) return;
    list.remove(listener as _UntypedEditorEventListener);
    if (list.isEmpty) {
      _listeners.remove(T);
    }
  }

  void publish<T extends EditorEvent>(T event) {
    final list = _listeners[event.runtimeType];
    if (list == null || list.isEmpty) return;
    for (final listener in List<_UntypedEditorEventListener>.of(list)) {
      listener(event);
    }
  }

  void clear() {
    _listeners.clear();
  }
}
