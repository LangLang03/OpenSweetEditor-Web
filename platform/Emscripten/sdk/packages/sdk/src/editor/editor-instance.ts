import {
  CompletionTriggerKind,
  DisposableStore,
  createTextModel,
  loadWasmModule,
  toDisposable,
  type ISweetEditorWasmModule,
  type ITextModel,
  type IDisposable,
} from "@sweeteditor/core";
import { SweetEditorWidget } from "@sweeteditor/widget";

import type {
  ICompletionContext,
  ICompletionItem,
  ICompletionList,
  ICompletionProvider,
  ICreateEditorOptions,
  IDecorationContext,
  IDecorationPatch,
  IDecorationProvider,
  IEditor,
  ILegacyDecorationProvider,
  IPlainObject,
  IWasmOptions,
} from "../types.js";

interface ICreateEditorOverrides {
  createWidget?: (container: HTMLElement, wasmModule: ISweetEditorWasmModule, options: IPlainObject) => SweetEditorWidget;
  loadWasm?: (options: ICreateEditorOptions["wasm"]) => Promise<ISweetEditorWasmModule>;
}

interface ILegacyCompletionReceiver {
  accept: (result: ICompletionList) => void;
}

interface ILegacyCompletionProvider {
  isTriggerCharacter?: (ch: string) => boolean;
  provideCompletions: (context: unknown, receiver: ILegacyCompletionReceiver) => Promise<void>;
}

interface ILegacyDecorationReceiver {
  accept: (result: IDecorationPatch) => void;
}

interface IMetadataAwareWidget {
  setMetadata: (metadata: { fileName?: string; language?: string }) => void;
}

const BUNDLED_RUNTIME_MODULE_RELATIVE_PATH = "../../runtime/sweeteditor.js";
const BUNDLED_RUNTIME_SYNTAX_ROOT_RELATIVE_PATH = "../../runtime/syntaxes/";

function asRecord(value: unknown): IPlainObject | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as IPlainObject;
}

function normalizeCompletionResult(result: ICompletionList | ICompletionItem[] | null | undefined): ICompletionList {
  if (!result) {
    return { items: [], isIncomplete: false };
  }
  if (Array.isArray(result)) {
    return { items: result, isIncomplete: false };
  }
  return {
    items: Array.isArray(result.items) ? result.items : [],
    isIncomplete: Boolean(result.isIncomplete),
  };
}

function mapCompletionContext(context: unknown): ICompletionContext {
  const record = asRecord(context);
  const cursorRecord = asRecord(record?.cursorPosition);
  return {
    triggerKind: Number(record?.triggerKind ?? CompletionTriggerKind.INVOKED),
    triggerCharacter: record?.triggerCharacter ? String(record.triggerCharacter) : null,
    cursorPosition: cursorRecord
      ? {
        line: Number(cursorRecord.line ?? 0),
        column: Number(cursorRecord.column ?? 0),
      }
      : null,
    word: record?.word ? String(record.word) : "",
  };
}

function normalizeDecorationContext(context: unknown): IDecorationContext {
  const record = asRecord(context);
  if (!record) {
    return {};
  }

  const normalized: IDecorationContext = {
    ...record,
  };

  if (Array.isArray(record.textChanges)) {
    const textChanges: NonNullable<IDecorationContext["textChanges"]> = [];
    for (const change of record.textChanges) {
      const changeRecord = asRecord(change);
      if (!changeRecord) {
        continue;
      }

      const normalizedChange: NonNullable<IDecorationContext["textChanges"]>[number] = {
        range: (changeRecord.range ?? null) as NonNullable<IDecorationContext["textChanges"]>[number]["range"],
      };
      const oldText = changeRecord.oldText ?? changeRecord.old_text;
      const newText = changeRecord.newText ?? changeRecord.new_text;
      if (oldText != null) {
        normalizedChange.oldText = String(oldText);
      }
      if (newText != null) {
        normalizedChange.newText = String(newText);
      }
      textChanges.push(normalizedChange);
    }
    normalized.textChanges = textChanges;
  }

  return normalized;
}

function makeLegacyOptions(
  options: ICreateEditorOptions,
  model: ITextModel,
  resolvedModulePath: string | undefined,
): IPlainObject {
  const widgetOptions = options.widgetOptions ?? {};
  return {
    ...widgetOptions,
    locale: options.locale,
    theme: options.theme,
    decorationOptions: options.decorationOptions,
    performanceOverlay: options.performanceOverlay,
    controller: options.controller ?? widgetOptions.controller,
    text: model.getValue(),
    modulePath: options.wasm?.modulePath ?? resolvedModulePath,
    moduleFactory: options.wasm?.moduleFactory,
    moduleOptions: options.wasm?.moduleOptions,
  };
}

function isLegacyDecorationProvider(provider: IDecorationProvider | ILegacyDecorationProvider): provider is ILegacyDecorationProvider {
  const maybeLegacy = provider as ILegacyDecorationProvider;
  if (typeof maybeLegacy.getCapabilities === "function") {
    return true;
  }
  if (typeof maybeLegacy.provideDecorations !== "function") {
    return false;
  }
  return maybeLegacy.provideDecorations.length >= 2;
}

export function getBundledWasmModulePath(): string {
  return new URL(BUNDLED_RUNTIME_MODULE_RELATIVE_PATH, import.meta.url).href;
}

export function getBundledSyntaxPath(name: string): string {
  const normalizedName = String(name ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\.?\//, "");

  if (!normalizedName) {
    throw new Error("syntax name is required");
  }
  if (normalizedName.includes("..")) {
    throw new Error(`invalid syntax name: ${name}`);
  }

  return new URL(`${BUNDLED_RUNTIME_SYNTAX_ROOT_RELATIVE_PATH}${normalizedName}`, import.meta.url).href;
}

function resolveWasmModulePath(wasmOptions: IWasmOptions | undefined): string | undefined {
  if (wasmOptions?.modulePath) {
    return wasmOptions.modulePath;
  }
  if (wasmOptions?.module || wasmOptions?.moduleFactory) {
    return undefined;
  }
  return getBundledWasmModulePath();
}

class EditorInstance implements IEditor {
  private readonly _widget: SweetEditorWidget;
  private readonly _store = new DisposableStore();
  private readonly _contentListeners = new Set<(model: ITextModel) => void>();
  private _model: ITextModel;
  private _disposed = false;

  constructor(widget: SweetEditorWidget, model: ITextModel) {
    this._widget = widget;
    this._model = model;

    this._store.add(toDisposable(() => {
      this._contentListeners.clear();
    }));

    this._widget.subscribe("TextChanged", () => {
      this._model.setValue(this._widget.getText());
      for (const listener of this._contentListeners) {
        listener(this._model);
      }
    });
  }

  getValue(): string {
    return this._widget.getText();
  }

  setValue(text: string): void {
    this._model.setValue(text);
    this._widget.loadText(text);
  }

  getModel(): ITextModel {
    return this._model;
  }

  setModel(model: ITextModel): void {
    this._model = model;
    this._widget.loadText(model.getValue());

    const metadataAwareWidget = this._widget as SweetEditorWidget & Partial<IMetadataAwareWidget>;
    if (typeof metadataAwareWidget.setMetadata === "function") {
      metadataAwareWidget.setMetadata({
        fileName: model.uri,
        language: model.language,
      });
    }
  }

  registerCompletionProvider(provider: ICompletionProvider): IDisposable {
    const legacyProvider: ILegacyCompletionProvider = {
      isTriggerCharacter: (ch: string) => Array.isArray(provider.triggerCharacters) && provider.triggerCharacters.includes(ch),
      provideCompletions: async (context: unknown, receiver: ILegacyCompletionReceiver) => {
        const mappedContext = mapCompletionContext(context);
        const resolved = await provider.provideCompletions(mappedContext, this._model);
        receiver.accept(normalizeCompletionResult(resolved));
      },
    };

    this._widget.addCompletionProvider(legacyProvider);
    const disposable = toDisposable(() => {
      this._widget.removeCompletionProvider(legacyProvider);
    });
    this._store.add(disposable);
    return disposable;
  }

  registerDecorationProvider(provider: IDecorationProvider | ILegacyDecorationProvider): IDisposable {
    const legacyProvider: ILegacyDecorationProvider = isLegacyDecorationProvider(provider)
      ? provider
      : {
        getCapabilities: () => provider.capabilities ?? {},
        provideDecorations: async (context: IDecorationContext, receiver: ILegacyDecorationReceiver) => {
          const patch = await provider.provideDecorations(normalizeDecorationContext(context), this._model);
          if (patch != null) {
            receiver.accept(patch);
          }
        },
      };

    this._widget.addDecorationProvider(legacyProvider);
    const disposable = toDisposable(() => {
      this._widget.removeDecorationProvider(legacyProvider);
    });
    this._store.add(disposable);
    return disposable;
  }

  onDidChangeModelContent(listener: (model: ITextModel) => void): IDisposable {
    this._contentListeners.add(listener);
    return toDisposable(() => {
      this._contentListeners.delete(listener);
    });
  }

  triggerCompletion(): void {
    this._widget.triggerCompletion();
  }

  getNativeWidget(): SweetEditorWidget {
    return this._widget;
  }

  dispose(): void {
    if (this._disposed) {
      return;
    }
    this._disposed = true;
    this._store.dispose();
    this._widget.dispose();
  }
}

export function createModel(text: string, options: { uri?: string; language?: string } = {}): ITextModel {
  return createTextModel(text, options);
}

export async function createEditor(
  container: HTMLElement,
  options: ICreateEditorOptions = {},
  overrides: ICreateEditorOverrides = {},
): Promise<IEditor> {
  if (!container) {
    throw new Error("container is required");
  }

  const modelOptions: { uri?: string; language?: string } = {};
  if (options.uri !== undefined) {
    modelOptions.uri = options.uri;
  }
  if (options.language !== undefined) {
    modelOptions.language = options.language;
  }
  const model = options.model ?? createModel(options.value ?? "", modelOptions);
  const resolvedModulePath = resolveWasmModulePath(options.wasm);

  const wasmLoader = overrides.loadWasm ?? (async (wasmOptions?: ICreateEditorOptions["wasm"]) => {
    if (wasmOptions?.module) {
      return wasmOptions.module;
    }
    const loadOptions: {
      modulePath?: string;
      moduleFactory?: NonNullable<IWasmOptions["moduleFactory"]>;
      moduleOptions?: IPlainObject;
    } = {};
    if (resolvedModulePath !== undefined) {
      loadOptions.modulePath = resolvedModulePath;
    }
    if (wasmOptions?.moduleFactory !== undefined) {
      loadOptions.moduleFactory = wasmOptions.moduleFactory;
    }
    if (wasmOptions?.moduleOptions !== undefined) {
      loadOptions.moduleOptions = wasmOptions.moduleOptions;
    }
    return loadWasmModule(loadOptions);
  });

  const wasmModule = await wasmLoader(options.wasm);
  const legacyOptions = makeLegacyOptions(options, model, resolvedModulePath);

  const widgetFactory = overrides.createWidget
    ?? ((host: HTMLElement, moduleObj: ISweetEditorWasmModule, widgetOptions: IPlainObject) => (
      new SweetEditorWidget(host, moduleObj, widgetOptions)
    ));
  const widget = widgetFactory(container, wasmModule, legacyOptions);

  const editor = new EditorInstance(widget, model);
  editor.setModel(model);
  return editor;
}
