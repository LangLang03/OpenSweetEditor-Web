import {
  CompletionTriggerKind,
  DisposableStore,
  createTextModel,
  loadWasmModule,
  toDisposable,
  type IAnyRecord,
  type ISweetEditorWasmModule,
  type ITextModel,
  type IDisposable,
} from "@opensweeteditor/core";
import { SweetEditorWidget } from "@opensweeteditor/widget";

import type {
  ICompletionContext,
  ICompletionItem,
  ICompletionList,
  ICompletionProvider,
  ICreateEditorOptions,
  IDecorationProvider,
  IEditor,
  ILegacyDecorationProvider,
  IWasmOptions,
} from "../types.js";

interface ICreateEditorOverrides {
  createWidget?: (container: HTMLElement, wasmModule: ISweetEditorWasmModule, options: IAnyRecord) => SweetEditorWidget;
  loadWasm?: (options: ICreateEditorOptions["wasm"]) => Promise<ISweetEditorWasmModule>;
}

const BUNDLED_RUNTIME_MODULE_RELATIVE_PATH = "../../runtime/sweeteditor.js";
const BUNDLED_RUNTIME_SYNTAX_ROOT_RELATIVE_PATH = "../../runtime/syntaxes/";

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

function mapCompletionContext(context: IAnyRecord | null | undefined): ICompletionContext {
  const cursor = context?.cursorPosition as { line?: number; column?: number } | undefined;
  return {
    triggerKind: Number(context?.triggerKind ?? CompletionTriggerKind.INVOKED),
    triggerCharacter: context?.triggerCharacter ? String(context.triggerCharacter) : null,
    cursorPosition: cursor
      ? {
        line: Number(cursor.line ?? 0),
        column: Number(cursor.column ?? 0),
      }
      : null,
    word: context?.word ? String(context.word) : "",
  };
}

function makeLegacyOptions(
  options: ICreateEditorOptions,
  model: ITextModel,
  resolvedModulePath: string | undefined,
): IAnyRecord {
  return {
    ...(options.widgetOptions ?? {}),
    locale: options.locale,
    theme: options.theme,
    decorationOptions: options.decorationOptions,
    performanceOverlay: options.performanceOverlay,
    text: model.getValue(),
    modulePath: options.wasm?.modulePath ?? resolvedModulePath,
    moduleFactory: options.wasm?.moduleFactory,
    moduleOptions: options.wasm?.moduleOptions,
  };
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
    if (typeof (this._widget as { setMetadata?: (metadata: IAnyRecord) => void }).setMetadata === "function") {
      (this._widget as { setMetadata: (metadata: IAnyRecord) => void }).setMetadata({
        fileName: model.uri,
        language: model.language,
      });
    }
  }

  registerCompletionProvider(provider: ICompletionProvider): IDisposable {
    const legacyProvider = {
      isTriggerCharacter: (ch: string) => Array.isArray(provider.triggerCharacters) && provider.triggerCharacters.includes(ch),
      provideCompletions: async (context: IAnyRecord, receiver: { accept: (result: ICompletionList) => void }) => {
        const mappedContext = mapCompletionContext(context);
        const resolved = await provider.provideCompletions(mappedContext, this._model);
        receiver.accept(normalizeCompletionResult(resolved));
      },
    };

    this._widget.addCompletionProvider(legacyProvider as never);
    const disposable = toDisposable(() => {
      this._widget.removeCompletionProvider(legacyProvider as never);
    });
    this._store.add(disposable);
    return disposable;
  }

  registerDecorationProvider(provider: IDecorationProvider | ILegacyDecorationProvider): IDisposable {
    const maybeLegacy = provider as ILegacyDecorationProvider;
    const isLegacyProvider = typeof maybeLegacy.getCapabilities === "function";
    const legacyProvider: ILegacyDecorationProvider = isLegacyProvider
      ? maybeLegacy
      : {
        getCapabilities: () => (provider as IDecorationProvider).capabilities ?? {},
        provideDecorations: async (context: IAnyRecord, receiver: { accept: (result: IAnyRecord) => void }) => {
          const patch = await (provider as IDecorationProvider).provideDecorations(context, this._model);
          if (patch != null) {
            receiver.accept(patch as IAnyRecord);
          }
        },
      };

    this._widget.addDecorationProvider(legacyProvider as never);
    const disposable = toDisposable(() => {
      this._widget.removeDecorationProvider(legacyProvider as never);
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
      moduleOptions?: IAnyRecord;
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

  const widgetFactory = overrides.createWidget ?? ((host: HTMLElement, moduleObj: ISweetEditorWasmModule, widgetOptions: IAnyRecord) => (
    new SweetEditorWidget(host, moduleObj, widgetOptions)
  ));
  const widget = widgetFactory(container, wasmModule, legacyOptions);

  const editor = new EditorInstance(widget, model);
  editor.setModel(model);
  return editor;
}
