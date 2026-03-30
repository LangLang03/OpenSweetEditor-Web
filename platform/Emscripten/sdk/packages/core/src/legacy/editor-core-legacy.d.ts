export declare function normalizeNewlines(text: any): string;
export declare function countLogicalLines(text: any): number;
export declare function clampVisibleLineRange(start: any, end: any, totalLines: any, maxLineSpan?: number): {
    start: number;
    end: number;
};
export declare function applyLineChangeToLines(lines: any, range: any, newText: any, options?: {}): void;
export declare function applyTextChangeToText(originalText: any, range: any, newText: any, options?: {}): string;
export declare function applyTextChangesToText(originalText: any, changes: any, options?: {}): string;
export declare function loadSweetEditorCore(options?: {}): Promise<any>;
export declare class Document {
    constructor(nativeDocument: any, kind: any);
    getNative(): any;
    getText(): any;
    getLineCount(): any;
    getLineText(line: any): any;
    getPositionFromCharIndex(charIndex: any): any;
    getCharIndexFromPosition(position: any): any;
    dispose(): void;
}
declare class PieceTableDocumentImpl extends Document {
    constructor(nativeDocument: any);
}
declare class LineArrayDocumentImpl extends Document {
    constructor(nativeDocument: any);
}
export declare class DocumentFactory {
    constructor(wasmModule: any);
    fromText(text: any, options?: {}): LineArrayDocumentImpl | PieceTableDocumentImpl;
    fromPieceTable(text: any): PieceTableDocumentImpl;
    fromLineArray(text: any): LineArrayDocumentImpl;
}
export declare class WebEditorCore {
    constructor(wasmModule: any, textMeasurerCallbacks: any, editorOptions?: {}, onDidMutate?: null);
    getNative(): any;
    beginBatch(): void;
    endBatch(): void;
    withBatch(fn: any): any;
    _invoke(method: any, ...args: any[]): any;
    call(method: any, ...args: any[]): any;
    read(method: any, ...args: any[]): any;
    loadDocument(document: any): any;
    setViewport(width: any, height: any): any;
    buildRenderModel(): any;
    handleGestureEvent(eventData: any): any;
    handleKeyEvent(eventData: any): any;
    tickEdgeScroll(): any;
    tickFling(): any;
    onFontMetricsChanged(): any;
    setFoldArrowMode(mode: any): any;
    setWrapMode(mode: any): any;
    setTabSize(tabSize: any): any;
    setScale(scale: any): any;
    setLineSpacing(add: any, mult: any): any;
    setContentStartPadding(padding: any): any;
    setShowSplitLine(show: any): any;
    setCurrentLineRenderMode(mode: any): any;
    getViewState(): any;
    getScrollMetrics(): any;
    getLayoutMetrics(): any;
    insert(text: any): any;
    replaceText(range: any, newText: any): any;
    deleteText(range: any): any;
    backspace(): any;
    deleteForward(): any;
    moveLineUp(): any;
    moveLineDown(): any;
    copyLineUp(): any;
    copyLineDown(): any;
    deleteLine(): any;
    insertLineAbove(): any;
    insertLineBelow(): any;
    undo(): any;
    redo(): any;
    setCursorPosition(position: any): any;
    setSelection(startOrRange: any, startColumn: any, endLine: any, endColumn: any): any;
    clearSelection(): any;
    selectAll(): any;
    getSelectedText(): any;
    moveCursorLeft(extendSelection?: boolean): any;
    moveCursorRight(extendSelection?: boolean): any;
    moveCursorUp(extendSelection?: boolean): any;
    moveCursorDown(extendSelection?: boolean): any;
    moveCursorToLineStart(extendSelection?: boolean): any;
    moveCursorToLineEnd(extendSelection?: boolean): any;
    compositionStart(): any;
    compositionUpdate(text: any): any;
    compositionEnd(committedText: any): any;
    compositionCancel(): any;
    isComposing(): any;
    setCompositionEnabled(enabled: any): any;
    isCompositionEnabled(): any;
    setReadOnly(readOnly: any): any;
    isReadOnly(): any;
    setAutoIndentMode(mode: any): any;
    getAutoIndentMode(): any;
    setHandleConfig(config: any): any;
    getHandleConfig(): any;
    setScrollbarConfig(config: any): any;
    getScrollbarConfig(): any;
    getPositionRect(line: any, column: any): any;
    getCursorRect(): any;
    scrollToLine(line: any, behavior?: number): any;
    gotoPosition(line: any, column: any): any;
    setScroll(scrollX: any, scrollY: any): any;
    insertSnippet(snippetTemplate: any): any;
    startLinkedEditing(model: any): any;
    linkedEditingNext(): any;
    linkedEditingPrev(): any;
    cancelLinkedEditing(): any;
    finishLinkedEditing(): any;
    toggleFoldAt(line: any): any;
    foldAt(line: any): any;
    unfoldAt(line: any): any;
    foldAll(): any;
    unfoldAll(): any;
    isLineVisible(line: any): any;
    setMatchedBrackets(open: any, close: any): any;
    clearMatchedBrackets(): any;
    getCursorPosition(): any;
    getWordRangeAtCursor(): any;
    getWordAtCursor(): any;
    getSelection(): any;
    hasSelection(): any;
    canUndo(): any;
    canRedo(): any;
    isInLinkedEditing(): any;
    registerTextStyle(styleId: any, color: any, backgroundColor?: number, fontStyle?: number): any;
    setLineSpans(line: any, layer: any, spans: any): void;
    setBatchLineSpans(layer: any, spansByLine: any): void;
    setLineInlayHints(line: any, hints: any): void;
    setBatchLineInlayHints(hintsByLine: any): void;
    setLinePhantomTexts(line: any, phantoms: any): void;
    setBatchLinePhantomTexts(phantomsByLine: any): void;
    setLineGutterIcons(line: any, icons: any): void;
    setBatchLineGutterIcons(iconsByLine: any): void;
    setLineDiagnostics(line: any, diagnostics: any): void;
    setBatchLineDiagnostics(diagsByLine: any): void;
    setIndentGuides(guides: any): void;
    setBracketGuides(guides: any): void;
    setFlowGuides(guides: any): void;
    setSeparatorGuides(guides: any): void;
    setFoldRegions(regions: any): void;
    setMaxGutterIcons(count: any): any;
    clearHighlights(layer?: null): any;
    clearInlayHints(): any;
    clearPhantomTexts(): any;
    clearGutterIcons(): any;
    clearDiagnostics(): any;
    clearGuides(): any;
    clearAllDecorations(): any;
    setBracketPairs(bracketPairs: any): void;
    _toNativeInlayHint(hint: any): {
        type: any;
        column: number;
        text: string;
        icon_id: number;
        color: number;
    };
    _toNativeEnumValue(enumName: any, value: any, fallback?: number): any;
    _callBatchLineEntries(entryVectorName: any, itemVectorName: any, entryFieldName: any, entriesByLine: any, itemMapper: any, fn: any): boolean;
    _callWithVector(vectorName: any, items: any, mapper: any, fn: any): void;
    dispose(): void;
    _notifyMutate(): void;
    _emitMutate(): void;
}
export declare const CompletionTriggerKind: Readonly<{
    INVOKED: 0;
    CHARACTER: 1;
    RETRIGGER: 2;
}>;
export declare class CompletionItem {
    static KIND_KEYWORD: number;
    static KIND_FUNCTION: number;
    static KIND_VARIABLE: number;
    static KIND_CLASS: number;
    static KIND_INTERFACE: number;
    static KIND_MODULE: number;
    static KIND_PROPERTY: number;
    static KIND_SNIPPET: number;
    static KIND_TEXT: number;
    static INSERT_TEXT_FORMAT_PLAIN_TEXT: number;
    static INSERT_TEXT_FORMAT_SNIPPET: number;
    constructor(init?: {});
    get matchText(): any;
}
export declare class CompletionContext {
    constructor({ triggerKind, triggerCharacter, cursorPosition, lineText, wordRange, languageConfiguration, editorMetadata, }?: {
        triggerKind?: 0 | undefined;
        triggerCharacter?: null | undefined;
        cursorPosition?: {
            line: number;
            column: number;
        } | undefined;
        lineText?: string | undefined;
        wordRange?: null | undefined;
        languageConfiguration?: null | undefined;
        editorMetadata?: null | undefined;
    });
}
export declare class CompletionResult {
    constructor(items?: never[], isIncomplete?: boolean);
    static EMPTY: CompletionResult;
}
export declare class CompletionReceiver {
    accept(_result: any): void;
    get isCancelled(): boolean;
}
export declare class CompletionProvider {
    isTriggerCharacter(_ch: any): boolean;
    provideCompletions(_context: any, _receiver: any): void;
}
export declare class CompletionProviderManager {
    constructor(options?: {});
    setListener(listener?: null): void;
    addProvider(provider: any): void;
    removeProvider(provider: any): void;
    isTriggerCharacter(ch: any): boolean;
    triggerCompletion(triggerKind?: 0, triggerCharacter?: null): void;
    showItems(items: any): void;
    dismiss(): void;
    _executeRefresh(triggerKind: any, triggerCharacter: any): void;
    _cancelAllReceivers(): void;
    _onProviderResult(_provider: any, result: any, generation: any): void;
    _emitItemsUpdated(items: any): void;
    _emitDismiss(): void;
}
export declare const DecorationType: Readonly<{
    SYNTAX_HIGHLIGHT: number;
    SEMANTIC_HIGHLIGHT: number;
    INLAY_HINT: number;
    DIAGNOSTIC: number;
    FOLD_REGION: number;
    INDENT_GUIDE: number;
    BRACKET_GUIDE: number;
    FLOW_GUIDE: number;
    SEPARATOR_GUIDE: number;
    GUTTER_ICON: number;
    PHANTOM_TEXT: number;
}>;
export declare const DecorationApplyMode: Readonly<{
    MERGE: 0;
    REPLACE_ALL: 1;
    REPLACE_RANGE: 2;
}>;
export declare const DecorationTextChangeMode: Readonly<{
    INCREMENTAL: "incremental";
    FULL: "full";
    DISABLED: "disabled";
}>;
export declare const DecorationResultDispatchMode: Readonly<{
    BOTH: "both";
    SYNC: "sync";
    ASYNC: "async";
}>;
export declare const DecorationProviderCallMode: Readonly<{
    SYNC: "sync";
    ASYNC: "async";
}>;
export declare class DecorationContext {
    constructor({ visibleStartLine, visibleEndLine, viewportStartLine, viewportEndLine, totalLineCount, textChanges, languageConfiguration, editorMetadata, }?: {
        visibleStartLine?: number | undefined;
        visibleEndLine?: number | undefined;
        viewportStartLine?: any;
        viewportEndLine?: any;
        totalLineCount?: number | undefined;
        textChanges?: never[] | undefined;
        languageConfiguration?: null | undefined;
        editorMetadata?: null | undefined;
    });
}
export declare class DecorationResult {
    constructor(init?: {});
}
export declare class DecorationReceiver {
    accept(_result: any): void;
    get isCancelled(): boolean;
}
export declare class DecorationProvider {
    getCapabilities(): number;
    provideDecorations(_context: any, _receiver: any): void;
}
export declare class SweetLineIncrementalDecorationProvider extends DecorationProvider {
    constructor(options?: {});
    getCapabilities(): any;
    dispose(): void;
    getLineCount(): number;
    setDocumentSource(fileName: any, text: any): void;
    provideDecorations(context: any, receiver: any): void;
    _buildVisibleRangeForRendering(context: any, totalLineCount: any): {
        start: number;
        end: number;
    };
    _buildLazyAnalyzeRange(visibleRange: any, totalLineCount: any): {
        start: number;
        end: number;
    };
    _resolveAnalyzerExtension(fileName: any): string;
    _ensureTextAnalyzer(fileName: any, fileChanged: any): boolean;
    _resetLineAnalyzeState(): void;
    _invalidateLineAnalyzeByChanges(changes: any): void;
    _invalidateLineAnalyzeFromLine(line: any): void;
    _scheduleLineAnalyze(range: any, receiver: any): void;
    _cancelPendingLineAnalyze(): void;
    _analyzeLineRangeSynchronously(startLine: any, endLine: any): number;
    _runLineAnalyzeChunk(jobId: any, receiver: any): void;
    _analyzeOneLineAtCursor(): boolean;
    _collectCachedSyntaxSpans(visibleRange: any): Map<any, any>;
    _setSourceText(text: any): void;
    _resolveContextFileName(context: any): any;
    _syncSourceFromDocument(): boolean;
    _applyTextChanges(changes: any): void;
    _tryRebuildAnalyzer(fileName: any): boolean;
    _tryAnalyzeIncremental(changes: any, fileName: any): boolean;
    _disposeAnalyzer(): void;
    _rebuildAnalyzer(fileName: any): void;
    _collectSyntaxSpans(visibleRange: any): Map<any, any>;
}
export declare class DecorationProviderManager {
    constructor(options?: {});
    setOptions(options?: {}): void;
    getOptions(): {
        scrollRefreshMinIntervalMs: any;
        overscanViewportMultiplier: any;
        textChangeMode: any;
        resultDispatchMode: any;
        providerCallMode: any;
        applySynchronously: any;
    };
    addProvider(provider: any): void;
    removeProvider(provider: any): void;
    requestRefresh(): void;
    onDocumentLoaded(): void;
    onTextChanged(changes: any): void;
    onScrollChanged(): void;
    _scheduleRefresh(delayMs: any, changes: any): void;
    _doRefresh(): void;
    _invokeProvider(provider: any, context: any, receiver: any): void;
    _resolveVisibleRange(): {
        start: number;
        end: number;
    };
    _resolveContextRange(visibleRange: any, totalLineCount: any): {
        start: any;
        end: any;
    };
    _onProviderPatch(provider: any, patch: any, generation: any): void;
    _scheduleApply(): void;
    _applyMerged(): void;
}
export {};
