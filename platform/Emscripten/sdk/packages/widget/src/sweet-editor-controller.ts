import type { IAnyValue, ITextPosition, ITextRange } from "@sweeteditor/core";
import type { SweetEditorWidget } from "./legacy/sweet-editor-widget-legacy.js";

type IWidgetOp = (widget: SweetEditorWidget) => void;

export class SweetEditorController {
  private _widget: SweetEditorWidget | null = null;
  private _disposed = false;
  private _queuedOps: IWidgetOp[] = [];
  private _readyCallbacks: Array<(widget: SweetEditorWidget) => void> = [];

  whenReady(callback:(widget: SweetEditorWidget) => void) {
    if (typeof callback !== "function" || this._disposed) {
      return;
    }
    if (this._widget) {
      callback(this._widget);
      return;
    }
    this._readyCallbacks.push(callback);
  }

  bind(editorApi:SweetEditorWidget) {
    if (this._disposed || !editorApi) {
      return;
    }
    if (this._widget && this._widget !== editorApi) {
      throw new Error("SweetEditorController is already bound to another editor instance.");
    }
    this._widget = editorApi;

    const queued = this._queuedOps;
    this._queuedOps = [];
    queued.forEach((op) => op(editorApi));

    const callbacks = this._readyCallbacks;
    this._readyCallbacks = [];
    callbacks.forEach((callback) => callback(editorApi));
  }

  unbind() {
    this._widget = null;
  }

  dispose() {
    if (this._disposed) {
      return;
    }
    this._disposed = true;
    this._widget = null;
    this._queuedOps = [];
    this._readyCallbacks = [];
  }

  getNativeWidget() {
    return this._widget;
  }

  invoke(method:string, ...args:IAnyValue[]) {
    this._enqueueOrRun((widget) => {
      const fn = (widget as IAnyValue)?.[method];
      if (typeof fn === "function") {
        fn.apply(widget, args);
      }
    });
  }

  loadDocument(document:IAnyValue) { this.invoke("loadDocument", document); }
  getDocument() { return this._read("getDocument", null); }
  loadText(text:string, options:IAnyValue = {}) { this.invoke("loadText", text, options); }
  getText() { return this._read("getText", ""); }

  applyTheme(theme:IAnyValue = {}) { this.invoke("applyTheme", theme); }
  getTheme() { return this._read("getTheme", {}); }
  getSettings() { return this._read("getSettings", null); }
  setKeyMap(keyMap:IAnyValue) { this.invoke("setKeyMap", keyMap); }
  setTabSize(tabSize:number) { this.invoke("setTabSize", tabSize); }
  setBackspaceUnindent(enabled:boolean) { this.invoke("setBackspaceUnindent", enabled); }
  setInsertSpaces(enabled:boolean) { this.invoke("setInsertSpaces", enabled); }
  setCompositionEnabled(enabled:boolean) { this.invoke("setCompositionEnabled", enabled); }
  isCompositionEnabled() { return this._read("isCompositionEnabled", true); }
  openImeCandidate() { this.invoke("openImeCandidate"); }
  closeImeCandidate() { this.invoke("closeImeCandidate"); }
  getKeyMap() { return this._read("getKeyMap", null); }
  setEditorIconProvider(provider:IAnyValue) { this.invoke("setEditorIconProvider", provider); }
  getEditorIconProvider() { return this._read("getEditorIconProvider", null); }

  insertText(text:string) { this.invoke("insertText", text); }
  replaceText(range:ITextRange, text:string) { this.invoke("replaceText", range, text); }
  deleteText(range:ITextRange) { this.invoke("deleteText", range); }
  moveLineUp() { this.invoke("moveLineUp"); }
  moveLineDown() { this.invoke("moveLineDown"); }
  copyLineUp() { this.invoke("copyLineUp"); }
  copyLineDown() { this.invoke("copyLineDown"); }
  deleteLine() { this.invoke("deleteLine"); }
  insertLineAbove() { this.invoke("insertLineAbove"); }
  insertLineBelow() { this.invoke("insertLineBelow"); }
  undo() { this.invoke("undo"); }
  redo() { this.invoke("redo"); }
  canUndo() { return this._read("canUndo", false); }
  canRedo() { return this._read("canRedo", false); }
  copyToClipboard() { this.invoke("copyToClipboard"); }
  pasteFromClipboard() { this.invoke("pasteFromClipboard"); }
  cutToClipboard() { this.invoke("cutToClipboard"); }

  selectAll() { this.invoke("selectAll"); }
  getSelectedText() { return this._read("getSelectedText", ""); }
  setSelection(startOrRange:ITextRange | ITextPosition, startColumn?: number, endLine?: number, endColumn?: number) {
    this.invoke("setSelection", startOrRange, startColumn, endLine, endColumn);
  }
  getSelection() { return this._read("getSelection", null); }
  setCursorPosition(position:ITextPosition) { this.invoke("setCursorPosition", position); }
  getCursorPosition() { return this._read("getCursorPosition", null); }
  getWordRangeAtCursor() { return this._read("getWordRangeAtCursor", null); }
  getWordAtCursor() { return this._read("getWordAtCursor", ""); }
  moveCursorPageUp(extendSelection:boolean = false) { this.invoke("moveCursorPageUp", extendSelection); }
  moveCursorPageDown(extendSelection:boolean = false) { this.invoke("moveCursorPageDown", extendSelection); }

  gotoPosition(line:number, column:number) { this.invoke("gotoPosition", line, column); }
  scrollToLine(line:number, behavior:number = 0) { this.invoke("scrollToLine", line, behavior); }
  setScroll(x:number, y:number) { this.invoke("setScroll", x, y); }
  ensureCursorVisible() { this.invoke("ensureCursorVisible"); }
  stopFling() { this.invoke("stopFling"); }
  getScrollMetrics() { return this._read("getScrollMetrics", null); }
  getPositionRect(line:number, column:number) { return this._read("getPositionRect", null, line, column); }
  getCursorRect() { return this._read("getCursorRect", null); }

  toggleFoldAt(line:number) { this.invoke("toggleFoldAt", line); }
  foldAt(line:number) { this.invoke("foldAt", line); }
  unfoldAt(line:number) { this.invoke("unfoldAt", line); }
  foldAll() { this.invoke("foldAll"); }
  unfoldAll() { this.invoke("unfoldAll"); }
  isLineVisible(line:number) { return this._read("isLineVisible", false, line); }

  setLanguageConfiguration(config:IAnyValue) { this.invoke("setLanguageConfiguration", config); }
  setAutoClosingPairs(pairs:IAnyValue) { this.invoke("setAutoClosingPairs", pairs); }
  getLanguageConfiguration() { return this._read("getLanguageConfiguration", null); }
  setMetadata(metadata:IAnyValue) { this.invoke("setMetadata", metadata); }
  getMetadata() { return this._read("getMetadata", null); }

  addDecorationProvider(provider:IAnyValue) { this.invoke("addDecorationProvider", provider); }
  removeDecorationProvider(provider:IAnyValue) { this.invoke("removeDecorationProvider", provider); }
  requestDecorationRefresh() { this.invoke("requestDecorationRefresh"); }
  addCompletionProvider(provider:IAnyValue) { this.invoke("addCompletionProvider", provider); }
  removeCompletionProvider(provider:IAnyValue) { this.invoke("removeCompletionProvider", provider); }
  addNewLineActionProvider(provider:IAnyValue) { this.invoke("addNewLineActionProvider", provider); }
  removeNewLineActionProvider(provider:IAnyValue) { this.invoke("removeNewLineActionProvider", provider); }
  triggerCompletion() { this.invoke("triggerCompletion"); }
  showCompletionItems(items:IAnyValue[]) { this.invoke("showCompletionItems", items); }
  dismissCompletion() { this.invoke("dismissCompletion"); }
  setCompletionItemRenderer(renderer:IAnyValue) { this.invoke("setCompletionItemRenderer", renderer); }

  registerTextStyle(styleId:number, color:number, backgroundColor:number = 0, fontStyle:number = 0) {
    this.invoke("registerTextStyle", styleId, color, backgroundColor, fontStyle);
  }
  registerBatchTextStyles(stylesById:IAnyValue) { this.invoke("registerBatchTextStyles", stylesById); }
  setLineSpans(line:number, layer:IAnyValue, spans:IAnyValue[]) { this.invoke("setLineSpans", line, layer, spans); }
  setBatchLineSpans(layer:IAnyValue, spansByLine:IAnyValue) { this.invoke("setBatchLineSpans", layer, spansByLine); }
  setLineInlayHints(line:number, hints:IAnyValue[]) { this.invoke("setLineInlayHints", line, hints); }
  setBatchLineInlayHints(hintsByLine:IAnyValue) { this.invoke("setBatchLineInlayHints", hintsByLine); }
  setLinePhantomTexts(line:number, phantoms:IAnyValue) { this.invoke("setLinePhantomTexts", line, phantoms); }
  setBatchLinePhantomTexts(phantomsByLine:IAnyValue) { this.invoke("setBatchLinePhantomTexts", phantomsByLine); }
  setLineGutterIcons(line:number, icons:IAnyValue[]) { this.invoke("setLineGutterIcons", line, icons); }
  setBatchLineGutterIcons(iconsByLine:IAnyValue) { this.invoke("setBatchLineGutterIcons", iconsByLine); }
  setLineCodeLens(line:number, items:IAnyValue[]) { this.invoke("setLineCodeLens", line, items); }
  setBatchLineCodeLens(itemsByLine:IAnyValue) { this.invoke("setBatchLineCodeLens", itemsByLine); }
  clearCodeLens() { this.invoke("clearCodeLens"); }
  setLineLinks(line:number, links:IAnyValue[]) { this.invoke("setLineLinks", line, links); }
  setBatchLineLinks(linksByLine:IAnyValue) { this.invoke("setBatchLineLinks", linksByLine); }
  clearLinks() { this.invoke("clearLinks"); }
  getLinkTargetAt(line:number, column:number) { return this._read("getLinkTargetAt", "", line, column); }
  setLineDiagnostics(line:number, diagnostics:IAnyValue[]) { this.invoke("setLineDiagnostics", line, diagnostics); }
  setBatchLineDiagnostics(diagsByLine:IAnyValue) { this.invoke("setBatchLineDiagnostics", diagsByLine); }
  setIndentGuides(guides:IAnyValue[]) { this.invoke("setIndentGuides", guides); }
  setBracketGuides(guides:IAnyValue[]) { this.invoke("setBracketGuides", guides); }
  setFlowGuides(guides:IAnyValue[]) { this.invoke("setFlowGuides", guides); }
  setSeparatorGuides(guides:IAnyValue[]) { this.invoke("setSeparatorGuides", guides); }
  setFoldRegions(regions:IAnyValue[]) { this.invoke("setFoldRegions", regions); }
  clearHighlights(layer?:IAnyValue) { this.invoke("clearHighlights", layer); }
  clearInlayHints() { this.invoke("clearInlayHints"); }
  clearPhantomTexts() { this.invoke("clearPhantomTexts"); }
  clearGutterIcons() { this.invoke("clearGutterIcons"); }
  clearDiagnostics() { this.invoke("clearDiagnostics"); }
  clearGuides() { this.invoke("clearGuides"); }
  clearAllDecorations() { this.invoke("clearAllDecorations"); }
  flush() { this.invoke("flush"); }
  getVisibleLineRange(options:IAnyValue = {}) { return this._read("getVisibleLineRange", { start: 0, end: -1 }, options); }
  getTotalLineCount() { return this._read("getTotalLineCount", 0); }

  private _enqueueOrRun(action:IWidgetOp) {
    if (this._disposed) {
      return;
    }
    if (this._widget) {
      action(this._widget);
      return;
    }
    this._queuedOps.push(action);
  }

  private _read<T>(method:string, fallback:T, ...args:IAnyValue[]): T {
    const widget = this._widget;
    if (!widget || this._disposed) {
      return fallback;
    }
    const fn = (widget as IAnyValue)?.[method];
    if (typeof fn !== "function") {
      return fallback;
    }
    return fn.apply(widget, args) as T;
  }
}
