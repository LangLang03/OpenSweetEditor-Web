# @sweeteditor/core

Low-level core package for OpenSweetEditor Web SDK.

If you want a ready-to-use editor API, use `@sweeteditor/sdk` first.

## Install

```bash
npm i @sweeteditor/core
```

## What this package provides

- Lifecycle utilities: `DisposableStore`, `toDisposable`
- Text model: `TextModel`, `createTextModel`
- Wasm loader bridge: `loadWasmModule`
- Legacy typed bridge exports (`WebEditorCore`, document/decorations/completion types)

## Quick start

```ts
import { createTextModel, loadWasmModule } from "@sweeteditor/core";

const model = createTextModel("int main() {}\n", {
  uri: "inmemory://demo/main.cpp",
  language: "cpp",
});

const wasm = await loadWasmModule({
  modulePath: "/runtime/sweeteditor.js",
});
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
