import type { IDisposable, ITextModel } from "@opensweeteditor/core";

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

export interface IDecorationProvider {
  capabilities?: Record<string, unknown>;
  provideDecorations(context: unknown, model: ITextModel): Promise<unknown> | unknown;
}

export interface IWasmOptions {
  module?: unknown;
  modulePath?: string;
  moduleFactory?: unknown;
  moduleOptions?: Record<string, unknown>;
}

export interface ICreateEditorOptions {
  wasm?: IWasmOptions;
  locale?: string;
  theme?: Record<string, unknown>;
  model?: ITextModel;
  value?: string;
  language?: string;
  uri?: string;
  decorationOptions?: Record<string, unknown>;
  performanceOverlay?: boolean | Record<string, unknown>;
  widgetOptions?: Record<string, unknown>;
}

export interface IEditor {
  getValue(): string;
  setValue(text: string): void;
  getModel(): ITextModel;
  setModel(model: ITextModel): void;
  registerCompletionProvider(provider: ICompletionProvider): IDisposable;
  registerDecorationProvider(provider: IDecorationProvider | unknown): IDisposable;
  onDidChangeModelContent(listener: (model: ITextModel) => void): IDisposable;
  triggerCompletion(): void;
  getNativeWidget(): unknown;
  dispose(): void;
}

