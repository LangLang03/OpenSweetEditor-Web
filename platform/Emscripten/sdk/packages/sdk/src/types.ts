import type {
  BracketGuide,
  DiagnosticItem,
  FlowGuide,
  FoldRegion,
  GutterIcon,
  IDisposable,
  IndentGuide,
  InlayHint,
  ISweetEditorWasmModule,
  LinkSpan,
  ITextModel,
  ITextRange,
  PhantomText,
  SeparatorGuide,
  StyleSpan,
} from "@sweeteditor/core";
import type { SweetEditorController, SweetEditorWidget } from "@sweeteditor/widget";

export type IPlainObject = Record<string, unknown>;

export interface ICompletionContext {
  readonly triggerKind: number;
  readonly triggerCharacter: string | null;
  readonly cursorPosition: { line: number; column: number } | null;
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
  provideCompletions(
    context: ICompletionContext,
    model: ITextModel,
  ): Promise<ICompletionList | ICompletionItem[] | null | undefined> | ICompletionList | ICompletionItem[] | null | undefined;
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
  syntaxSpans?: ILineDataMap<StyleSpan>;
  semanticSpans?: ILineDataMap<StyleSpan>;
  inlayHints?: ILineDataMap<InlayHint>;
  links?: ILineDataMap<LinkSpan>;
  diagnostics?: ILineDataMap<DiagnosticItem>;
  indentGuides?: IndentGuide[];
  bracketGuides?: BracketGuide[];
  flowGuides?: FlowGuide[];
  separatorGuides?: SeparatorGuide[];
  foldRegions?: FoldRegion[];
  gutterIcons?: ILineDataMap<GutterIcon>;
  phantomTexts?: ILineDataMap<PhantomText>;
  syntaxSpansMode?: number;
  semanticSpansMode?: number;
  inlayHintsMode?: number;
  linksMode?: number;
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
  provideDecorations(
    context: IDecorationContext,
    model: ITextModel,
  ): Promise<IDecorationPatch | null | void> | IDecorationPatch | null | void;
}

export interface ILegacyDecorationProvider {
  getCapabilities?: () => IPlainObject | number;
  provideDecorations?: (
    context: IDecorationContext,
    receiver: { accept: (result: IDecorationPatch) => void },
  ) => void | Promise<void>;
}

export interface IWasmOptions {
  module?: ISweetEditorWasmModule;
  modulePath?: string;
  moduleFactory?: (options?: IPlainObject) => Promise<ISweetEditorWasmModule> | ISweetEditorWasmModule;
  moduleOptions?: IPlainObject;
}

export interface IEditorDecorationOptions extends IPlainObject {}

export type ILineDataMap<T> =
  | Record<number, T[]>
  | Map<number, T[]>
  | Array<{ line: number; items?: T[]; spans?: T[]; hints?: T[]; phantoms?: T[]; icons?: T[]; diagnostics?: T[] }>;

export interface IEditorWidgetOptions extends IPlainObject {
  controller?: SweetEditorController;
}

export interface IEditorTheme extends IPlainObject {}

export interface IEditorPerformanceOverlayOptions extends IPlainObject {}

export interface IEditorCreateMetadata {
  uri?: string;
  language?: string;
}

export interface ICreateEditorOptions {
  wasm?: IWasmOptions;
  locale?: string;
  theme?: IEditorTheme;
  controller?: SweetEditorController;
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
