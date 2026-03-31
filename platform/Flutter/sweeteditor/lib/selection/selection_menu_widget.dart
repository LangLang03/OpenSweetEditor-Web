import 'package:flutter/material.dart';

import 'selection_types.dart';

/// Floating selection menu rendered from a list of [SelectionMenuItem]s.
class SelectionMenuWidget extends StatelessWidget {
  const SelectionMenuWidget({
    super.key,
    required this.position,
    required this.items,
    required this.onItemTap,
    this.bgColor = 0xFF2D3139,
    this.textColor = 0xFFD7DEE9,
    this.disabledTextColor = 0x50D7DEE9,
  });

  final Offset position;
  final List<SelectionMenuItem> items;
  final void Function(SelectionMenuItem item) onItemTap;
  final int bgColor;
  final int textColor;
  final int disabledTextColor;

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: position.dx,
      top: position.dy,
      child: Material(
        color: Colors.transparent,
        child: Container(
          decoration: BoxDecoration(
            color: Color(bgColor),
            borderRadius: BorderRadius.circular(8),
            boxShadow: const [
              BoxShadow(
                color: Colors.black26,
                blurRadius: 4,
                offset: Offset(0, 2),
              ),
            ],
          ),
          padding: const EdgeInsets.symmetric(horizontal: 4),
          height: 36,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (int i = 0; i < items.length; i++) ...[
                if (i > 0) _divider(),
                _button(items[i]),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _button(SelectionMenuItem item) {
    return GestureDetector(
      onTap: item.enabled ? () => onItemTap(item) : null,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Center(
          child: Text(
            item.label,
            style: TextStyle(
              color: Color(item.enabled ? textColor : disabledTextColor),
              fontSize: 12,
            ),
          ),
        ),
      ),
    );
  }

  Widget _divider() {
    return Container(
      width: 1,
      height: 20,
      color: Color(textColor).withValues(alpha: 0.15),
    );
  }
}
