import 'package:sweeteditor/sweeteditor.dart';

class DemoCompletionProvider implements CompletionProvider {
  static const _triggerChars = {'.', ':'};

  @override
  bool isTriggerCharacter(String ch) => _triggerChars.contains(ch);

  @override
  void provideCompletions(
    CompletionContext context,
    CompletionReceiver receiver,
  ) {
    if (context.triggerKind == CompletionTriggerKind.character &&
        context.triggerCharacter == '.') {
      _provideMemberCompletions(receiver);
      return;
    }
    _provideKeywordCompletions(receiver);
  }

  @override
  void dispose() {}

  void _provideMemberCompletions(CompletionReceiver receiver) {
    receiver.accept(
      CompletionResult(
        isIncomplete: false,
        items: [
          CompletionItem()
            ..label = 'length'
            ..detail = 'size_t'
            ..kind = CompletionItem.kindProperty
            ..insertText = 'length()'
            ..sortKey = 'a_length',
          CompletionItem()
            ..label = 'push_back'
            ..detail = 'void push_back(T)'
            ..kind = CompletionItem.kindFunction
            ..insertText = 'push_back()'
            ..sortKey = 'b_push_back',
          CompletionItem()
            ..label = 'begin'
            ..detail = 'iterator'
            ..kind = CompletionItem.kindFunction
            ..insertText = 'begin()'
            ..sortKey = 'c_begin',
          CompletionItem()
            ..label = 'end'
            ..detail = 'iterator'
            ..kind = CompletionItem.kindFunction
            ..insertText = 'end()'
            ..sortKey = 'd_end',
          CompletionItem()
            ..label = 'size'
            ..detail = 'size_t'
            ..kind = CompletionItem.kindFunction
            ..insertText = 'size()'
            ..sortKey = 'e_size',
        ],
      ),
    );
  }

  void _provideKeywordCompletions(CompletionReceiver receiver) {
    Future.delayed(const Duration(milliseconds: 200), () {
      if (receiver.isCancelled()) return;
      receiver.accept(
        CompletionResult(
          isIncomplete: false,
          items: [
            CompletionItem()
              ..label = 'std::string'
              ..detail = 'class'
              ..kind = CompletionItem.kindClass
              ..insertText = 'std::string'
              ..sortKey = 'a_string',
            CompletionItem()
              ..label = 'std::vector'
              ..detail = 'template class'
              ..kind = CompletionItem.kindClass
              ..insertText = 'std::vector<>'
              ..sortKey = 'b_vector',
            CompletionItem()
              ..label = 'std::cout'
              ..detail = 'ostream'
              ..kind = CompletionItem.kindVariable
              ..insertText = 'std::cout'
              ..sortKey = 'c_cout',
            CompletionItem()
              ..label = 'if'
              ..detail = 'snippet'
              ..kind = CompletionItem.kindSnippet
              ..insertText = 'if () {\n\t\n}'
              ..sortKey = 'd_if',
            CompletionItem()
              ..label = 'for'
              ..detail = 'snippet'
              ..kind = CompletionItem.kindSnippet
              ..insertText = 'for (int i = 0; i < n; ++i) {\n\t\n}'
              ..sortKey = 'e_for',
            CompletionItem()
              ..label = 'class'
              ..detail = 'snippet'
              ..kind = CompletionItem.kindSnippet
              ..insertText =
                  'class ClassName {\npublic:\n\tClassName() {}\n\t~ClassName() {}\n};'
              ..sortKey = 'f_class',
            CompletionItem()
              ..label = 'return'
              ..detail = 'keyword'
              ..kind = CompletionItem.kindKeyword
              ..insertText = 'return '
              ..sortKey = 'g_return',
          ],
        ),
      );
    });
  }
}
