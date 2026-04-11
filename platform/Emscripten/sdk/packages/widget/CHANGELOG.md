# Changelog

## 0.0.7-rc.1 - 2026-04-11

- Added widget/controller forwarding APIs for new core capabilities:
  tab size, insert-spaces/backspace-unindent, page cursor movement,
  ensure-cursor-visible, stop-fling, CodeLens operations, and auto-closing pairs.
- Synced widget keymap changes to native core via `setKeyMap` bridge.
- Updated language configuration application to push
  `autoClosingPairs`, `tabSize`, and `insertSpaces` into core.
- Extended settings facade typing/behavior for new text-input settings.

## 0.0.6 - 2026-04-11

- Baseline release for browser widget layer in the v2 workspace.
