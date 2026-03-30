/* @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";

import { createEditor, createModel } from "./editor-instance.js";

class FakeWidget {
  private readonly listeners = new Map<string, Set<() => void>>();
  private _text = "";
  completionProviders: unknown[] = [];
  decorationProviders: unknown[] = [];
  disposeCalled = false;
  triggerCompletionCalled = false;
  metadata: Record<string, unknown> | null = null;

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

  addCompletionProvider(provider: unknown): void {
    this.completionProviders.push(provider);
  }

  removeCompletionProvider(provider: unknown): void {
    this.completionProviders = this.completionProviders.filter((item) => item !== provider);
  }

  addDecorationProvider(provider: unknown): void {
    this.decorationProviders.push(provider);
  }

  removeDecorationProvider(provider: unknown): void {
    this.decorationProviders = this.decorationProviders.filter((item) => item !== provider);
  }

  triggerCompletion(): void {
    this.triggerCompletionCalled = true;
  }

  setMetadata(metadata: Record<string, unknown>): void {
    this.metadata = metadata;
  }

  dispose(): void {
    this.disposeCalled = true;
  }
}

describe("editor instance", () => {
  it("creates editor and syncs model content changes", async () => {
    const widget = new FakeWidget();
    const model = createModel("hello", { uri: "inmemory://demo", language: "txt" });
    const editor = await createEditor(
      document.createElement("div"),
      { model },
      {
        loadWasm: async () => ({}),
        createWidget: () => widget,
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
        loadWasm: async () => ({}),
        createWidget: () => widget,
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
});
