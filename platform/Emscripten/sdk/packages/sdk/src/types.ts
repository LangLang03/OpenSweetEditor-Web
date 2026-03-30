import type { IAnyRecord, IDisposable, ISweetEditorWasmModule, ITextModel } from "@opensweeteditor/core";
import type { SweetEditorWidget } from "@opensweeteditor/widget";

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
  capabilities?: IAnyRecord;
  provideDecorations(context: IAnyRecord, model: ITextModel): Promise<IAnyRecord | null | void> | IAnyRecord | null | void;
}

export interface ILegacyDecorationProvider {
  getCapabilities?: () => IAnyRecord | number;
  provideDecorations?: (
    context: IAnyRecord,
    receiver: { accept: (result: IAnyRecord) => void },
  ) => void | Promise<void>;
}

export interface IWasmOptions {
  module?: ISweetEditorWasmModule;
  modulePath?: string;
  moduleFactory?: (options?: IAnyRecord) => Promise<ISweetEditorWasmModule> | ISweetEditorWasmModule;
  moduleOptions?: IAnyRecord;
}

export interface ICreateEditorOptions {
  wasm?: IWasmOptions;
  locale?: string;
  theme?: IAnyRecord;
  model?: ITextModel;
  value?: string;
  language?: string;
  uri?: string;
  decorationOptions?: IAnyRecord;
  performanceOverlay?: boolean | IAnyRecord;
  widgetOptions?: IAnyRecord;
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
