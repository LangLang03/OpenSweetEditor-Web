import 'package:sweeteditor/sweeteditor.dart';
import 'package:sweeteditor/editor_core.dart' as core;

const int iconType = 1;
const int iconAt = 2;

class DemoDecorationProvider implements DecorationProvider {
  DemoDecorationProvider(this._getLineText);

  final String Function(int line) _getLineText;

  @override
  Set<DecorationType> getCapabilities() => {
    DecorationType.inlayHint,
    DecorationType.diagnostic,
    DecorationType.foldRegion,
    DecorationType.indentGuide,
    DecorationType.gutterIcon,
  };

  @override
  void provideDecorations(
    DecorationContext context,
    DecorationReceiver receiver,
  ) {
    final inlayHints = <int, List<core.InlayHint>>{};
    final diagnostics = <int, List<core.DiagnosticItem>>{};
    final gutterIcons = <int, List<core.GutterIcon>>{};
    final foldRegions = <core.FoldRegion>[];
    final indentGuides = <core.IndentGuide>[];
    final braceStack = <int>[]; // stack of lines with '{'

    for (
      var line = context.visibleStartLine;
      line <= context.visibleEndLine;
      line++
    ) {
      final text = _getLineText(line);
      if (text.isEmpty) continue;

      _scanInlayHints(line, text, inlayHints);
      _scanDiagnostics(line, text, diagnostics);
      _scanGutterIcons(line, text, gutterIcons);
      _scanBraces(line, text, braceStack, foldRegions);
      _scanIndentGuide(line, text, context.totalLineCount, indentGuides);
    }

    final result = DecorationResultBuilder()
        .inlayHints(inlayHints, ApplyMode.replaceAll)
        .diagnostics(diagnostics, ApplyMode.replaceAll)
        .gutterIcons(gutterIcons, ApplyMode.replaceAll)
        .foldRegions(foldRegions, ApplyMode.replaceAll)
        .indentGuides(indentGuides, ApplyMode.replaceAll)
        .build();
    receiver.accept(result);
  }

  @override
  void dispose() {}

  void _scanInlayHints(
    int line,
    String text,
    Map<int, List<core.InlayHint>> out,
  ) {
    final trimmed = text.trimLeft();

    // "const" → "immutable" hint
    if (trimmed.startsWith('const ')) {
      final col = text.indexOf('const');
      out
          .putIfAbsent(line, () => [])
          .add(
            core.InlayHint(
              type: core.InlayType.text,
              column: col + 5,
              text: ' immutable',
            ),
          );
    }

    // "return" → "value: " hint
    if (trimmed.startsWith('return ')) {
      final col = text.indexOf('return');
      out
          .putIfAbsent(line, () => [])
          .add(
            core.InlayHint(
              type: core.InlayType.text,
              column: col + 6,
              text: ' value:',
            ),
          );
    }

    // 0xFF hex color literals → color swatch hint
    final hexPattern = RegExp(r'0[xX]([0-9A-Fa-f]{6,8})\b');
    for (final match in hexPattern.allMatches(text)) {
      final hexStr = match.group(1)!;
      var value = int.tryParse(hexStr, radix: 16) ?? 0;
      if (hexStr.length == 6) value = 0xFF000000 | value;
      out
          .putIfAbsent(line, () => [])
          .add(
            core.InlayHint(
              type: core.InlayType.color,
              column: match.start,
              intValue: value,
            ),
          );
    }
  }

  void _scanDiagnostics(
    int line,
    String text,
    Map<int, List<core.DiagnosticItem>> out,
  ) {
    // FIXME → error severity
    final fixmeIdx = text.indexOf('FIXME');
    if (fixmeIdx >= 0) {
      out
          .putIfAbsent(line, () => [])
          .add(
            core.DiagnosticItem(
              column: fixmeIdx,
              length: 5,
              severity: 0,
              color: 0xFFF7768E,
            ),
          );
    }

    // TODO → warning severity
    final todoIdx = text.indexOf('TODO');
    if (todoIdx >= 0) {
      out
          .putIfAbsent(line, () => [])
          .add(
            core.DiagnosticItem(
              column: todoIdx,
              length: 4,
              severity: 1,
              color: 0xFFE0AF68,
            ),
          );
    }
  }

  void _scanGutterIcons(
    int line,
    String text,
    Map<int, List<core.GutterIcon>> out,
  ) {
    final trimmed = text.trimLeft();
    if (trimmed.startsWith('class ') || trimmed.startsWith('struct ')) {
      out.putIfAbsent(line, () => []).add(core.GutterIcon(iconId: iconType));
    }
    if (trimmed.contains('@')) {
      out.putIfAbsent(line, () => []).add(core.GutterIcon(iconId: iconAt));
    }
  }

  void _scanBraces(
    int line,
    String text,
    List<int> stack,
    List<core.FoldRegion> out,
  ) {
    final trimmed = text.trimRight();
    if (trimmed.endsWith('{')) {
      stack.add(line);
    } else if (trimmed.startsWith('}') ||
        trimmed == '}' ||
        trimmed.endsWith('}')) {
      if (stack.isNotEmpty) {
        final startLine = stack.removeLast();
        if (line > startLine + 1) {
          out.add(core.FoldRegion(startLine: startLine, endLine: line));
        }
      }
    }
  }

  void _scanIndentGuide(
    int line,
    String text,
    int totalLines,
    List<core.IndentGuide> out,
  ) {
    if (text.isEmpty) return;
    var indent = 0;
    for (var i = 0; i < text.length; i++) {
      if (text[i] == ' ') {
        indent++;
      } else if (text[i] == '\t') {
        indent += 4;
      } else {
        break;
      }
    }
    if (indent >= 4) {
      final endLine = (line + 1 < totalLines) ? line + 1 : line;
      for (var level = 4; level <= indent; level += 4) {
        out.add(
          core.IndentGuide(
            start: core.TextPosition(line, level),
            end: core.TextPosition(endLine, level),
          ),
        );
      }
    }
  }
}
