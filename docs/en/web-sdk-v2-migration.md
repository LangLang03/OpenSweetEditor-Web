# Web SDK v1 -> v2 Migration

This guide helps migrate from the previous Web v1 API to Web SDK v2.

## Core Changes

1. v2 main package is `@opensweeteditor/sdk`.
2. Main entry changed from `createSweetEditor(...)` to `createEditor(...)`.
3. Model is now explicit and decoupled via `createModel(...)`.
4. Wasm loading options moved under `options.wasm`.
5. Completion/decoration registration now returns `IDisposable`.

## API Mapping

| v1 | v2 |
| --- | --- |
| `createSweetEditor(container, options)` | `createEditor(container, options)` |
| `editor.loadText(text)` | `editor.setModel(createModel(text, ...))` or `editor.setValue(text)` |
| flat `modulePath/moduleFactory/moduleOptions` | `options.wasm.modulePath/moduleFactory/moduleOptions` |
| `addCompletionProvider` | `registerCompletionProvider` |
| `addDecorationProvider` | `registerDecorationProvider` |

## Before (v1)

```ts
import { createSweetEditor } from "./index.js";

const editor = await createSweetEditor(container, {
  modulePath: "./sweeteditor.js",
  locale: "en"
});
editor.loadText("hello");
```

## After (v2)

```ts
import { createEditor, createModel } from "@opensweeteditor/sdk";

const model = createModel("hello", {
  uri: "inmemory://demo/main.txt",
  language: "plain_text"
});

const editor = await createEditor(container, {
  model,
  locale: "en",
  wasm: {
    modulePath: "./runtime/sweeteditor.js"
  }
});
```

## SweetLine Migration

- Use `@opensweeteditor/providers-sweetline`.
- Create provider with `createSweetLineDecorationProvider(...)`.
- Register via `editor.registerDecorationProvider(provider)`.
