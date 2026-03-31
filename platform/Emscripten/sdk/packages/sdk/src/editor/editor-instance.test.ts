/* @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import type { ISweetEditorWasmModule } from "@sweeteditor/core";
import type { SweetEditorWidget } from "@sweeteditor/widget";

import { createEditor, createModel, getBundledSyntaxPath, getBundledWasmModulePath } from "./editor-instance.js";

class FakeWidget {
  private readonly listeners = new Map<string, Set<() => void>>();
  private _text = "";
  completionProviders: object[] = [];
  decorationProviders: object[] = [];
  disposeCalled = false;
  triggerCompletionCalled = false;
  metadata: Record<string, any> | null = null;

  subscribe(event: string, listener: () => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(listener);
  }

  emit(event: string): void {
    for (const listener of this.listeners.get(event) ?? []) {
      listener();
    }
  }

  loadText(text: string): void {
    this._text = text;
  }

  getText(): string {
    return this._text;
  }

  addCompletionProvider(provider: object): void {
    this.completionProviders.push(provider);
  }

  removeCompletionProvider(provider: object): void {
    this.completionProviders = this.completionProviders.filter((item: object) => item !== provider);
  }

  addDecorationProvider(provider: object): void {
    this.decorationProviders.push(provider);
  }

  removeDecorationProvider(provider: object): void {
    this.decorationProviders = this.decorationProviders.filter((item: object) => item !== provider);
  }

  triggerCompletion(): void {
    this.triggerCompletionCalled = true;
  }

  setMetadata(metadata: Record<string, any>): void {
    this.metadata = metadata;
  }

  dispose(): void {
    this.disposeCalled = true;
  }
}

interface IRegisteredCompletionProvider {
  provideCompletions: (
    context: unknown,
    receiver: { accept: (result: unknown) => void },
  ) => Promise<void> | void;
}

interface IRegisteredDecorationProvider {
  provideDecorations: (
    context: unknown,
    receiver: { accept: (result: unknown) => void },
  ) => Promise<void> | void;
}

describe("editor instance", () => {
  it("resolves bundled wasm module path", () => {
    expect(getBundledWasmModulePath()).toContain("/runtime/sweeteditor.js");
  });

  it("resolves bundled syntax path", () => {
    expect(getBundledSyntaxPath("kotlin.json")).toContain("/runtime/syntaxes/kotlin.json");
    expect(getBundledSyntaxPath("./lua.json")).toContain("/runtime/syntaxes/lua.json");
    expect(() => getBundledSyntaxPath("../escape.json")).toThrowError("invalid syntax name");
  });

  it("creates editor and syncs model content changes", async () => {
    const widget = new FakeWidget();
    const model = createModel("hello", { uri: "inmemory://demo", language: "txt" });
    const editor = await createEditor(
      document.createElement("div"),
      { model },
      {
        loadWasm: async () => ({} as ISweetEditorWasmModule),
        createWidget: () => widget as unknown as SweetEditorWidget,
      },
    );

    widget.loadText("hello world");
    widget.emit("TextChanged");
    expect(editor.getModel().getValue()).toBe("hello world");

    const listener = vi.fn();
    const d = editor.onDidChangeModelContent(listener);
    widget.loadText("next");
    widget.emit("TextChanged");
    expect(listener).toHaveBeenCalledTimes(1);
    d.dispose();

    editor.dispose();
    expect(widget.disposeCalled).toBe(true);
  });

  it("registers completion and decoration providers with disposables", async () => {
    const widget = new FakeWidget();
    const editor = await createEditor(
      document.createElement("div"),
      {},
      {
        loadWasm: async () => ({} as ISweetEditorWasmModule),
        createWidget: () => widget as unknown as SweetEditorWidget,
      },
    );

    const completionDisposable = editor.registerCompletionProvider({
      triggerCharacters: ["."],
      provideCompletions: () => [{ label: "print" }],
    });
    expect(widget.completionProviders.length).toBe(1);
    completionDisposable.dispose();
    expect(widget.completionProviders.length).toBe(0);

    const decorationDisposable = editor.registerDecorationProvider({
      provideDecorations: () => ({ spansByLine: new Map() }),
    });
    expect(widget.decorationProviders.length).toBe(1);
    decorationDisposable.dispose();
    expect(widget.decorationProviders.length).toBe(0);
  });

  it("normalizes completion context before forwarding to SDK provider", async () => {
    const widget = new FakeWidget();
    const editor = await createEditor(
      document.createElement("div"),
      {},
      {
        loadWasm: async () => ({} as ISweetEditorWasmModule),
        createWidget: () => widget as unknown as SweetEditorWidget,
      },
    );

    const provideCompletions = vi.fn().mockResolvedValue([{ label: "println" }]);
    editor.registerCompletionProvider({
      provideCompletions,
    });

    const registered = widget.completionProviders[0] as IRegisteredCompletionProvider;
    const accepted: unknown[] = [];
    await registered.provideCompletions(
      {
        triggerKind: 1,
        triggerCharacter: ".",
        cursorPosition: { line: 7, column: 3 },
        word: "pri",
      },
      {
        accept: (result: unknown) => {
          accepted.push(result);
        },
      },
    );

    expect(provideCompletions).toHaveBeenCalledTimes(1);
    expect(provideCompletions).toHaveBeenCalledWith(
      {
        triggerKind: 1,
        triggerCharacter: ".",
        cursorPosition: { line: 7, column: 3 },
        word: "pri",
      },
      editor.getModel(),
    );
    expect(accepted).toEqual([
      {
        items: [{ label: "println" }],
        isIncomplete: false,
      },
    ]);
  });

  it("normalizes legacy snake_case decoration changes for typed providers", async () => {
    const widget = new FakeWidget();
    const editor = await createEditor(
      document.createElement("div"),
      {},
      {
        loadWasm: async () => ({} as ISweetEditorWasmModule),
        createWidget: () => widget as unknown as SweetEditorWidget,
      },
    );

    const provideDecorations = vi.fn().mockResolvedValue({ syntaxSpans: new Map(), syntaxSpansMode: 2 });
    editor.registerDecorationProvider({
      provideDecorations,
    });

    const registered = widget.decorationProviders[0] as IRegisteredDecorationProvider;
    const accepted: unknown[] = [];
    await registered.provideDecorations(
      {
        textChanges: [{
          range: null,
          old_text: "before",
          new_text: "after",
        }],
      },
      {
        accept: (result: unknown) => {
          accepted.push(result);
        },
      },
    );

    expect(provideDecorations).toHaveBeenCalledTimes(1);
    const [contextArg, modelArg] = provideDecorations.mock.calls[0] ?? [];
    expect(modelArg).toBe(editor.getModel());
    expect(contextArg).toMatchObject({
      textChanges: [{
        range: null,
        oldText: "before",
        newText: "after",
      }],
    });
    expect(accepted).toEqual([{ syntaxSpans: new Map(), syntaxSpansMode: 2 }]);
  });
});

