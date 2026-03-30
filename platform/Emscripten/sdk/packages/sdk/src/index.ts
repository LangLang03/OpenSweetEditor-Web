export { createEditor, createModel } from "./editor/editor-instance.js";
export type {
  ICompletionContext,
  ICompletionItem,
  ICompletionList,
  ICompletionProvider,
  ICreateEditorOptions,
  IDecorationProvider,
  IEditor,
  IWasmOptions,
} from "./types.js";

export {
  CompletionItem,
  CompletionResult,
  CompletionTriggerKind,
  DecorationApplyMode,
  countLogicalLines,
  DecorationProviderCallMode,
  DecorationResult,
  DecorationResultDispatchMode,
  DecorationTextChangeMode,
  DisposableStore,
  normalizeNewlines,
  toDisposable,
  type IDisposable,
  type ITextModel,
} from "@opensweeteditor/core";
