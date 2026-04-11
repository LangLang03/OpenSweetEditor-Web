# Changelog

## 0.0.7-rc.1 - 2026-04-11

- Added bindings and typed access for newly exposed editor core APIs:
  `setTabSize`, `setGutterSticky`, `setGutterVisible`, `tickAnimations`,
  `stopFling`, `setKeyMap`, page cursor movement, indentation toggles,
  `ensureCursorVisible`, batch text-style registration, CodeLens APIs,
  and `setAutoClosingPairs`.
- Added support for new visual/gesture enum and field mappings used by web side
  (`VisualRunType.TAB/CODELENS`, `HitTargetType.CODELENS`, visual active/kind fields).
- Added missing touch/fling config field mapping in bindings.

## 0.0.6 - 2026-04-11

- Baseline release for v2 package split and typed legacy bridge surface.
