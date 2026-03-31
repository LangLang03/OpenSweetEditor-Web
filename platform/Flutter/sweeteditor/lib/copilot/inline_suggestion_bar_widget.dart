import 'package:flutter/material.dart';

import '../editor_types.dart';

const double _kSuggestionBarGap = 4;
const double _kSuggestionBarHeight = 28;

/// Positioned inline suggestion action bar (Accept / Dismiss).
class InlineSuggestionBarWidget extends StatelessWidget {
  const InlineSuggestionBarWidget({
    super.key,
    required this.x,
    required this.y,
    required this.cursorHeight,
    required this.theme,
    required this.onAccept,
    required this.onDismiss,
  });

  final double x;
  final double y;
  final double cursorHeight;
  final EditorTheme theme;
  final VoidCallback onAccept;
  final VoidCallback onDismiss;

  @override
  Widget build(BuildContext context) {
    final top = y + cursorHeight + _kSuggestionBarGap;

    return Positioned(
      left: x,
      top: top,
      child: Container(
        height: _kSuggestionBarHeight,
        decoration: BoxDecoration(
          color: Color(theme.inlineSuggestionBarBgColor),
          borderRadius: BorderRadius.circular(6),
          boxShadow: const [
            BoxShadow(
              color: Color(0x40000000),
              blurRadius: 6,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _barButton(
              'Tab  Accept',
              Color(theme.inlineSuggestionBarAcceptColor),
              onAccept,
            ),
            Container(width: 1, height: 16, color: const Color(0x30FFFFFF)),
            _barButton(
              'Esc  Dismiss',
              Color(theme.inlineSuggestionBarDismissColor),
              onDismiss,
            ),
          ],
        ),
      ),
    );
  }

  Widget _barButton(String label, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10),
        child: Text(
          label,
          style: TextStyle(
            color: color,
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }
}
