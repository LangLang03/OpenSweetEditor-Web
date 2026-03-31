import 'dart:ffi' as ffi;

import 'package:ffi/ffi.dart';
import 'package:flutter/material.dart';

import '../editor_core.dart' as core;
import '../sweeteditor_bindings_generated.dart' as bindings;

/// Global measurer instance referenced by FFI static callbacks.
EditorTextMeasurer? _globalMeasurer;

/// TextPainter-based text measurement for the native editor engine.
class EditorTextMeasurer {
  EditorTextMeasurer({required String fontFamily, required double fontSize})
    : _fontFamily = fontFamily,
      _fontSize = fontSize {
    _globalMeasurer = this;
    _buildCallbackPointers();
  }

  String _fontFamily;
  double _fontSize;
  final Map<int, TextStyle> _flutterStyleCache = {};
  final Map<int, ({double lineHeight, double ascent, double descent})>
  _fontMetricsCache = {};
  ({double lineHeight, double ascent, double descent})? _inlayHintFontMetrics;

  late final ffi.Pointer<
    ffi.NativeFunction<ffi.Float Function(ffi.Pointer<ffi.Uint16>, ffi.Int32)>
  >
  _measureTextWidthPtr;
  late final ffi.Pointer<
    ffi.NativeFunction<ffi.Float Function(ffi.Pointer<ffi.Uint16>)>
  >
  _measureInlayHintWidthPtr;
  late final ffi.Pointer<ffi.NativeFunction<ffi.Float Function(ffi.Int32)>>
  _measureIconWidthPtr;
  late final ffi.Pointer<
    ffi.NativeFunction<ffi.Void Function(ffi.Pointer<ffi.Float>, ffi.Size)>
  >
  _getFontMetricsPtr;

  void _buildCallbackPointers() {
    _measureTextWidthPtr =
        ffi.Pointer.fromFunction<
          ffi.Float Function(ffi.Pointer<ffi.Uint16>, ffi.Int32)
        >(_nativeMeasureTextWidth, 0.0);
    _measureInlayHintWidthPtr =
        ffi.Pointer.fromFunction<ffi.Float Function(ffi.Pointer<ffi.Uint16>)>(
          _nativeMeasureInlayHintWidth,
          0.0,
        );
    _measureIconWidthPtr =
        ffi.Pointer.fromFunction<ffi.Float Function(ffi.Int32)>(
          _nativeMeasureIconWidth,
          0.0,
        );
    _getFontMetricsPtr =
        ffi.Pointer.fromFunction<
          ffi.Void Function(ffi.Pointer<ffi.Float>, ffi.Size)
        >(_nativeGetFontMetrics);
  }

  /// Build the native text_measurer_t struct for EditorCore.
  bindings.text_measurer_t buildNativeMeasurer() {
    final measurer = calloc<bindings.text_measurer_t>();
    measurer.ref.measure_text_width = _measureTextWidthPtr;
    measurer.ref.measure_inlay_hint_width = _measureInlayHintWidthPtr;
    measurer.ref.measure_icon_width = _measureIconWidthPtr;
    measurer.ref.get_font_metrics = _getFontMetricsPtr;
    final result = measurer.ref;
    calloc.free(measurer);
    return result;
  }

  void updateFont(String fontFamily, double fontSize) {
    _fontFamily = fontFamily;
    _fontSize = fontSize;
    _flutterStyleCache.clear();
    _fontMetricsCache.clear();
    _inlayHintFontMetrics = null;
  }

  String get fontFamily => _fontFamily;
  double get fontSize => _fontSize;

  /// Measure text width for a given font style bitmask (0=normal, 1=bold, 2=italic, 3=bold+italic).
  double measureText(String text, int fontStyle) {
    if (text.isEmpty) return 0;
    final style = _getFlutterStyleForFontStyle(fontStyle);
    final painter = TextPainter(
      text: TextSpan(text: text, style: style),
      textDirection: TextDirection.ltr,
    )..layout();
    return painter.width;
  }

  double measureInlayHintText(String text) {
    if (text.isEmpty) return 0;
    final style = TextStyle(
      fontFamily: 'sans-serif',
      fontSize: _fontSize * 0.9,
    );
    final painter = TextPainter(
      text: TextSpan(text: text, style: style),
      textDirection: TextDirection.ltr,
    )..layout();
    return painter.width;
  }

  double measureIcon(int iconId) => 16.0;

  /// Get font metrics: (lineHeight, ascent, descent).
  ({double lineHeight, double ascent, double descent}) getFontMetrics([
    int fontStyle = 0,
  ]) {
    return _fontMetricsCache.putIfAbsent(fontStyle, () {
      return _measureFontMetrics(_getFlutterStyleForFontStyle(fontStyle));
    });
  }

  ({double ascent, double descent}) getNativeFontMetrics([int fontStyle = 0]) {
    final metrics = getFontMetrics(fontStyle);
    return (ascent: -metrics.ascent, descent: metrics.descent);
  }

  ({double lineHeight, double ascent, double descent})
  getInlayHintFontMetrics() {
    return _inlayHintFontMetrics ??= _measureFontMetrics(buildInlayHintStyle());
  }

  ({double lineHeight, double ascent, double descent}) _measureFontMetrics(
    TextStyle style,
  ) {
    final painter = TextPainter(
      text: TextSpan(text: 'Mg', style: style),
      textDirection: TextDirection.ltr,
    )..layout();
    final baseline =
        painter.computeDistanceToActualBaseline(TextBaseline.alphabetic) ??
        painter.height * 0.8;
    return (
      lineHeight: painter.height,
      ascent: baseline,
      descent: (painter.height - baseline).clamp(0.0, double.infinity),
    );
  }

  /// Convert a sweeteditor fontStyle bitmask to a Flutter TextStyle.
  TextStyle _getFlutterStyleForFontStyle(int fontStyle) {
    return _flutterStyleCache.putIfAbsent(fontStyle, () {
      return TextStyle(
        fontFamily: _fontFamily,
        fontSize: _fontSize,
        fontWeight: (fontStyle & 1) != 0 ? FontWeight.bold : FontWeight.normal,
        fontStyle: (fontStyle & 2) != 0 ? FontStyle.italic : FontStyle.normal,
        height: 1.0,
      );
    });
  }

  /// Build a Flutter TextStyle for a VisualRun's style info.
  TextStyle buildRunStyle(core.TextStyle runStyle, int defaultTextColor) {
    final color = runStyle.color != 0
        ? Color(runStyle.color)
        : Color(defaultTextColor);
    return TextStyle(
      fontFamily: _fontFamily,
      fontSize: _fontSize,
      color: color,
      fontWeight: (runStyle.fontStyle & 1) != 0
          ? FontWeight.bold
          : FontWeight.normal,
      fontStyle: (runStyle.fontStyle & 2) != 0
          ? FontStyle.italic
          : FontStyle.normal,
      height: 1.0,
    );
  }

  TextStyle buildPhantomTextStyle(int phantomColor) {
    return TextStyle(
      fontFamily: _fontFamily,
      fontSize: _fontSize,
      color: Color(phantomColor),
      fontStyle: FontStyle.italic,
      height: 1.0,
    );
  }

  TextStyle buildInlayHintStyle() {
    return TextStyle(
      fontFamily: 'sans-serif',
      fontSize: _fontSize * 0.9,
      height: 1.0,
    );
  }
}

// FFI static callbacks (must be top-level for Pointer.fromFunction)

double _nativeMeasureTextWidth(ffi.Pointer<ffi.Uint16> text, int fontStyle) {
  if (text == ffi.nullptr || _globalMeasurer == null) return 0;
  var length = 0;
  while ((text + length).value != 0) {
    length++;
  }
  if (length == 0) return 0;
  final dartString = String.fromCharCodes(text.asTypedList(length));
  return _globalMeasurer!.measureText(dartString, fontStyle);
}

double _nativeMeasureInlayHintWidth(ffi.Pointer<ffi.Uint16> text) {
  if (text == ffi.nullptr || _globalMeasurer == null) return 0;
  var length = 0;
  while ((text + length).value != 0) {
    length++;
  }
  if (length == 0) return 0;
  final dartString = String.fromCharCodes(text.asTypedList(length));
  return _globalMeasurer!.measureInlayHintText(dartString);
}

double _nativeMeasureIconWidth(int iconId) {
  return _globalMeasurer?.measureIcon(iconId) ?? 16.0;
}

void _nativeGetFontMetrics(ffi.Pointer<ffi.Float> arr, int length) {
  if (_globalMeasurer == null) {
    if (length >= 1) (arr + 0).value = -14.0;
    if (length >= 2) (arr + 1).value = 6.0;
    return;
  }
  final metrics = _globalMeasurer!.getNativeFontMetrics();
  if (length >= 1) (arr + 0).value = metrics.ascent;
  if (length >= 2) (arr + 1).value = metrics.descent;
}
