part of '../editor_core.dart';

/// Tab stop range within a linked editing session.
class TabStopRange {
  const TabStopRange({
    required this.startLine,
    required this.startColumn,
    required this.endLine,
    required this.endColumn,
  });

  final int startLine;
  final int startColumn;
  final int endLine;
  final int endColumn;
}

/// Tab stop group in a linked editing session.
class TabStopGroup {
  const TabStopGroup({
    required this.index,
    this.defaultText,
    this.ranges = const <TabStopRange>[],
  });

  final int index;
  final String? defaultText;
  final List<TabStopRange> ranges;
}

/// Linked editing model.
class LinkedEditingModel {
  const LinkedEditingModel({this.groups = const <TabStopGroup>[]});

  final List<TabStopGroup> groups;
}
