# Web SDK v2 Full API Reference (100% Coverage)

This document uses `platform/Emscripten/sdk/packages/*/dist/*.d.ts` as the single source of truth and mirrors public declarations file-by-file for full API coverage.

- Scope: `@sweeteditor/sdk`, `@sweeteditor/core`, `@sweeteditor/widget`, `@sweeteditor/providers-sweetline`
- Sync rule: run `pnpm -r build` and then `pnpm docs:api`; declaration changes mean API changes
- Note: members prefixed with `_` are legacy/internal surface from historical bridge code; prefer high-level APIs in `@sweeteditor/sdk` for stable integration

## Package Versions
- `@sweeteditor/sdk@0.0.4`
- `@sweeteditor/providers-sweetline@0.0.4`
- `@sweeteditor/widget@0.0.4`
- `@sweeteditor/core@0.0.4`

## Contents
- [@sweeteditor/sdk](#sweeteditorsdk)
- [@sweeteditor/providers-sweetline](#sweeteditorproviders-sweetline)
- [@sweeteditor/widget](#sweeteditorwidget)
- [@sweeteditor/core](#sweeteditorcore)

## @sweeteditor/sdk
Version: `0.0.4`

Complete declaration mirrors:

### `platform/Emscripten/sdk/packages/sdk/dist/index.d.ts`

```ts
export { createEditor, createModel, getBundledSyntaxPath, getBundledWasmModulePath } from "./editor/editor-instance.js";
export type { ICompletionContext, ICompletionItem, ICompletionList, ICompletionProvider, ICreateEditorOptions, IDecorationProvider, IEditor, IWasmOptions, } from "./types.js";
export { CompletionItem, CompletionResult, CompletionTriggerKind, DecorationApplyMode, countLogicalLines, DecorationProviderCallMode, DecorationResult, DecorationResultDispatchMode, DecorationTextChangeMode, DisposableStore, normalizeNewlines, toDisposable, type IDisposable, type ITextModel, } from "@sweeteditor/core";
```

### `platform/Emscripten/sdk/packages/sdk/dist/editor/editor-instance.d.ts`

```ts
import { type ISweetEditorWasmModule, type ITextModel } from "@sweeteditor/core";
import { SweetEditorWidget } from "@sweeteditor/widget";
import type { ICreateEditorOptions, IEditor, IPlainObject } from "../types.js";
interface ICreateEditorOverrides {
    createWidget?: (container: HTMLElement, wasmModule: ISweetEditorWasmModule, options: IPlainObject) => SweetEditorWidget;
    loadWasm?: (options: ICreateEditorOptions["wasm"]) => Promise<ISweetEditorWasmModule>;
}
export declare function getBundledWasmModulePath(): string;
export declare function getBundledSyntaxPath(name: string): string;
export declare function createModel(text: string, options?: {
    uri?: string;
    language?: string;
}): ITextModel;
export declare function createEditor(container: HTMLElement, options?: ICreateEditorOptions, overrides?: ICreateEditorOverrides): Promise<IEditor>;
export {};
```

### `platform/Emscripten/sdk/packages/sdk/dist/types.d.ts`

```ts
import type { IDisposable, ISweetEditorWasmModule, ITextModel, ITextRange } from "@sweeteditor/core";
import type { SweetEditorWidget } from "@sweeteditor/widget";
export type IPlainObject = Record<string, unknown>;
export interface ICompletionContext {
    readonly triggerKind: number;
    readonly triggerCharacter: string | null;
    readonly cursorPosition: {
        line: number;
        column: number;
    } | null;
    readonly word: string;
}
export interface ICompletionItem {
    label: string;
    insertText?: string;
    detail?: string;
    documentation?: string;
    kind?: number;
    sortKey?: string;
    filterText?: string;
    insertTextFormat?: number;
}
export interface ICompletionList {
    items: ICompletionItem[];
    isIncomplete?: boolean;
}
export interface ICompletionProvider {
    triggerCharacters?: string[];
    provideCompletions(context: ICompletionContext, model: ITextModel): Promise<ICompletionList | ICompletionItem[] | null | undefined> | ICompletionList | ICompletionItem[] | null | undefined;
}
export interface IEditorTextChange {
    range: ITextRange | null;
    oldText?: string;
    newText?: string;
}
export interface IDecorationContext {
    visibleStartLine?: number;
    visibleEndLine?: number;
    viewportStartLine?: number;
    viewportEndLine?: number;
    totalLineCount?: number;
    textChanges?: IEditorTextChange[];
    languageConfiguration?: IPlainObject | null;
    editorMetadata?: IPlainObject | null;
    [key: string]: unknown;
}
export interface IDecorationPatch {
    syntaxSpans?: unknown;
    semanticSpans?: unknown;
    inlayHints?: unknown;
    diagnostics?: unknown;
    indentGuides?: unknown;
    bracketGuides?: unknown;
    flowGuides?: unknown;
    separatorGuides?: unknown;
    foldRegions?: unknown;
    gutterIcons?: unknown;
    phantomTexts?: unknown;
    syntaxSpansMode?: number;
    semanticSpansMode?: number;
    inlayHintsMode?: number;
    diagnosticsMode?: number;
    indentGuidesMode?: number;
    bracketGuidesMode?: number;
    flowGuidesMode?: number;
    separatorGuidesMode?: number;
    foldRegionsMode?: number;
    gutterIconsMode?: number;
    phantomTextsMode?: number;
    [key: string]: unknown;
}
export interface IDecorationProvider {
    capabilities?: IPlainObject;
    provideDecorations(context: IDecorationContext, model: ITextModel): Promise<IDecorationPatch | null | void> | IDecorationPatch | null | void;
}
export interface ILegacyDecorationProvider {
    getCapabilities?: () => IPlainObject | number;
    provideDecorations?: (context: IDecorationContext, receiver: {
        accept: (result: IDecorationPatch) => void;
    }) => void | Promise<void>;
}
export interface IWasmOptions {
    module?: ISweetEditorWasmModule;
    modulePath?: string;
    moduleFactory?: (options?: IPlainObject) => Promise<ISweetEditorWasmModule> | ISweetEditorWasmModule;
    moduleOptions?: IPlainObject;
}
export interface IEditorDecorationOptions extends IPlainObject {
}
export interface IEditorWidgetOptions extends IPlainObject {
}
export interface IEditorTheme extends IPlainObject {
}
export interface IEditorPerformanceOverlayOptions extends IPlainObject {
}
export interface IEditorCreateMetadata {
    uri?: string;
    language?: string;
}
export interface ICreateEditorOptions {
    wasm?: IWasmOptions;
    locale?: string;
    theme?: IEditorTheme;
    model?: ITextModel;
    value?: string;
    language?: string;
    uri?: string;
    decorationOptions?: IEditorDecorationOptions;
    performanceOverlay?: boolean | IEditorPerformanceOverlayOptions;
    widgetOptions?: IEditorWidgetOptions;
}
export interface IEditor {
    getValue(): string;
    setValue(text: string): void;
    getModel(): ITextModel;
    setModel(model: ITextModel): void;
    registerCompletionProvider(provider: ICompletionProvider): IDisposable;
    registerDecorationProvider(provider: IDecorationProvider | ILegacyDecorationProvider): IDisposable;
    onDidChangeModelContent(listener: (model: ITextModel) => void): IDisposable;
    triggerCompletion(): void;
    getNativeWidget(): SweetEditorWidget;
    dispose(): void;
}
```

## @sweeteditor/providers-sweetline
Version: `0.0.4`

Complete declaration mirrors:

### `platform/Emscripten/sdk/packages/providers-sweetline/dist/index.d.ts`

```ts
import { SweetLineIncrementalDecorationProvider, type IDisposable } from "@sweeteditor/core";
export type ISweetLineProvider = InstanceType<typeof SweetLineIncrementalDecorationProvider>;
export declare function createSweetLineDecorationProvider(options?: Record<string, unknown>): ISweetLineProvider;
export interface IDecorationRegistrationTarget {
    registerDecorationProvider(provider: unknown): IDisposable;
}
export declare function registerSweetLineDecorationProvider(editor: IDecorationRegistrationTarget, options?: Record<string, unknown>): {
    provider: ISweetLineProvider;
    disposable: IDisposable;
};
```

## @sweeteditor/widget
Version: `0.0.4`

Complete declaration mirrors:

### `platform/Emscripten/sdk/packages/widget/dist/index.d.ts`

```ts
import { SweetEditorWidget } from "./legacy/sweet-editor-widget-legacy.js";
import type { ISweetEditorWasmModule } from "@sweeteditor/core";
export { EditorEventType, SweetEditorWidget } from "./legacy/sweet-editor-widget-legacy.js";
export interface IWidgetCreateOptions extends Record<string, unknown> {
    locale?: string;
    theme?: Record<string, unknown>;
    decorationOptions?: Record<string, unknown>;
    performanceOverlay?: boolean | Record<string, unknown>;
    text?: string;
    modulePath?: string;
    moduleFactory?: ((options?: Record<string, unknown>) => unknown | Promise<unknown>) | unknown;
    moduleOptions?: Record<string, unknown>;
}
export declare function createWidget(container: HTMLElement, wasmModule: ISweetEditorWasmModule, options?: IWidgetCreateOptions): InstanceType<typeof SweetEditorWidget>;
```

### `platform/Emscripten/sdk/packages/widget/dist/legacy/sweet-editor-widget-legacy.d.ts`

```ts
export * from "./widget-constants.js";
export * from "./widget-renderer.js";
export * from "./widget-completion-popup.js";
export * from "./widget-core.js";
```

## @sweeteditor/core
Version: `0.0.4`

Complete declaration mirrors:

### `platform/Emscripten/sdk/packages/core/dist/index.d.ts`

```ts
export * from "./base/lifecycle.js";
export * from "./editor/model.js";
export * from "./platform/wasm.js";
export * from "./legacy/embind-contracts.js";
export * from "./legacy/editor-input-types.js";
export * from "./legacy/editor-core-legacy.js";
```

### `platform/Emscripten/sdk/packages/core/dist/base/lifecycle.d.ts`

```ts
export interface IDisposable {
    dispose(): void;
}
export declare function toDisposable(onDispose: () => void): IDisposable;
export declare class DisposableStore implements IDisposable {
    private readonly _items;
    private _isDisposed;
    add<T extends IDisposable>(item: T): T;
    clear(): void;
    dispose(): void;
}
```

### `platform/Emscripten/sdk/packages/core/dist/editor/model.d.ts`

```ts
import type { IEditorTextChange } from "../legacy/editor-input-types.js";
export interface IModelOptions {
    uri?: string;
    language?: string;
}
export interface ITextModel {
    readonly uri: string;
    readonly language: string;
    readonly versionId: number;
    getValue(): string;
    setValue(text: string): void;
    applyTextChanges(changes: Iterable<IEditorTextChange> | IEditorTextChange[] | null | undefined): void;
}
export declare class TextModel implements ITextModel {
    readonly uri: string;
    readonly language: string;
    private _value;
    private _versionId;
    constructor(text: string, options?: IModelOptions);
    get versionId(): number;
    getValue(): string;
    setValue(text: string): void;
    applyTextChanges(changes: Iterable<IEditorTextChange> | IEditorTextChange[] | null | undefined): void;
}
export declare function createTextModel(text: string, options?: IModelOptions): TextModel;
```

### `platform/Emscripten/sdk/packages/core/dist/platform/wasm.d.ts`

```ts
import type { IAnyRecord, ISweetEditorWasmModule } from "../legacy/embind-contracts.js";
export interface IWasmModuleOptions extends IAnyRecord {
    locateFile?: (path: string) => string;
}
export type IWasmModuleFactory = (options: IWasmModuleOptions) => ISweetEditorWasmModule | Promise<ISweetEditorWasmModule>;
export interface IWasmLoadOptions {
    modulePath?: string;
    moduleFactory?: IWasmModuleFactory;
    moduleOptions?: IWasmModuleOptions;
}
export declare function loadWasmModule(options?: IWasmLoadOptions): Promise<ISweetEditorWasmModule>;
```

### `platform/Emscripten/sdk/packages/core/dist/legacy/embind-contracts.d.ts`

```ts
export type IAnyValue = any;
export type IAnyRecord = Record<string, IAnyValue>;
export interface IEmbindDeletable {
    delete(): void;
}
export interface IEmbindVector<T> extends IEmbindDeletable {
    size(): number;
    get(index: number): T;
    push_back?(value: T): void;
}
export interface IEmbindEnumValue {
    value: number;
}
export type IEmbindEnumLike = number | IEmbindEnumValue;
export interface ITextPosition {
    line: number;
    column: number;
}
export interface ITextRange {
    start: ITextPosition;
    end: ITextPosition;
}
export interface INativeDocument extends IEmbindDeletable {
    getU8Text(): string;
    getLineCount(): number;
    getLineU16Text(line: number): string;
    getPositionFromCharIndex(charIndex: number): ITextPosition;
    getCharIndexFromPosition(position: ITextPosition): number;
}
export interface INativeEditorCore extends IEmbindDeletable {
    loadDocument(document: INativeDocument): IAnyValue;
    setViewport(size: {
        width: number;
        height: number;
    }): IAnyValue;
    buildRenderModel(): IAnyValue;
    handleGestureEventRaw(type: number, points: IAnyValue, modifiers: number, wheelDeltaX: number, wheelDeltaY: number, directScale: number): IAnyValue;
    handleKeyEventRaw(keyCode: number, text: string, modifiers: number): IAnyValue;
    [key: string]: IAnyValue;
}
export interface ISweetEditorWasmModule extends IAnyRecord {
    EditorCore: new (textMeasurerCallbacks: IAnyRecord, nativeOptions: IAnyRecord) => INativeEditorCore;
    PieceTableDocument: new (text: string) => INativeDocument;
    LineArrayDocument: new (text: string) => INativeDocument;
}
```

### `platform/Emscripten/sdk/packages/core/dist/legacy/editor-input-types.d.ts`

```ts
import type { IAnyRecord, ITextPosition, ITextRange } from "./embind-contracts.js";
export interface IEditorPointerPoint {
    x: number;
    y: number;
    id?: number;
}
export interface IEditorGestureEvent {
    type: number;
    points: IEditorPointerPoint[] | IAnyRecord;
    modifiers?: number;
    wheelDeltaX?: number;
    wheelDeltaY?: number;
    directScale?: number;
}
export interface IEditorKeyEvent {
    keyCode: number;
    text?: string;
    modifiers?: number;
}
export interface IEditorTextChange {
    range: ITextRange | null;
    oldText?: string;
    newText?: string;
}
export interface IVisibleLineRange {
    start: number;
    end: number;
    startLine?: number;
    endLine?: number;
}
export interface ILanguageBracketPair {
    open: string;
    close: string;
    autoClose?: boolean;
    surround?: boolean;
}
export interface ILanguageConfiguration {
    bracketPairs?: ILanguageBracketPair[];
    [key: string]: IAnyRecord | ITextPosition | ITextRange | IEditorPointerPoint | string | number | boolean | null | undefined;
}
export interface IEditorMetadata {
    fileName?: string;
    language?: string;
    cursorPosition?: ITextPosition;
    [key: string]: IAnyRecord | ITextPosition | ITextRange | IEditorPointerPoint | string | number | boolean | null | undefined;
}
```

### `platform/Emscripten/sdk/packages/core/dist/legacy/editor-core-legacy.d.ts`

```ts
export * from "./text-change-utils.js";
export * from "./document.js";
export * from "./web-editor-core.js";
export * from "./completion.js";
export * from "./decoration.js";
```

