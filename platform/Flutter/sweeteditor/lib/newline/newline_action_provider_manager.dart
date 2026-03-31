import '../editor_types.dart';

import 'newline_types.dart';

/// Chain-based manager for newline providers.
/// Iterates until the first non-null provider takes effect.
class NewLineActionProviderManager {
  final List<NewLineActionProvider> _providers = [];

  void addProvider(NewLineActionProvider provider) {
    _providers.add(provider);
  }

  void removeProvider(NewLineActionProvider provider) {
    _providers.remove(provider);
  }

  NewLineAction? provideNewLineAction(
    int lineNumber,
    int column,
    String lineText,
    LanguageConfiguration? languageConfiguration,
    EditorMetadata? editorMetadata,
  ) {
    final context = NewLineContext(
      lineNumber: lineNumber,
      column: column,
      lineText: lineText,
      languageConfiguration: languageConfiguration,
      editorMetadata: editorMetadata,
    );
    for (final provider in _providers) {
      final action = provider.provideNewLineAction(context);
      if (action != null) return action;
    }
    return null;
  }
}
