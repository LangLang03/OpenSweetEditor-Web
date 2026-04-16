import '../editor_types.dart';

/// Newline action result, describing the text to be inserted after pressing Enter.
class NewLineAction {
  const NewLineAction({required this.text});

  final String text;
}

/// Newline context, provided to NewLineActionProvider for indent calculation.
class NewLineContext {
  const NewLineContext({
    required this.lineNumber,
    required this.column,
    required this.lineText,
    this.languageConfiguration,
    this.editorMetadata,
  });

  final int lineNumber;
  final int column;
  final String lineText;
  final LanguageConfiguration? languageConfiguration;
  final EditorMetadata? editorMetadata;
}

/// Smart newline provider interface.
/// Return null to indicate the current provider does not handle this,
/// pass to the next provider in the chain.
abstract class NewLineActionProvider {
  NewLineAction? provideNewLineAction(NewLineContext context);
}
