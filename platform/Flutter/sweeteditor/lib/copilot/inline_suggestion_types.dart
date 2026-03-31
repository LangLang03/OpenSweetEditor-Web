/// Immutable value object describing a single inline suggestion.
class InlineSuggestion {
  const InlineSuggestion({
    required this.line,
    required this.column,
    required this.text,
  });

  final int line;
  final int column;
  final String text;
}

/// Callback for inline suggestion accept/dismiss events.
abstract class InlineSuggestionListener {
  void onSuggestionAccepted(InlineSuggestion suggestion);
  void onSuggestionDismissed(InlineSuggestion suggestion);
}
