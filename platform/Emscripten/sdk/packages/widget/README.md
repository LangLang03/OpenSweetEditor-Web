# @sweeteditor/widget

Browser widget layer for OpenSweetEditor Web SDK.

This package exposes the canvas/input widget and controller utilities.
If you prefer a simpler integration API, use `@sweeteditor/sdk`.

## Install

```bash
npm i @sweeteditor/widget @sweeteditor/core
```

## Quick start

```ts
import { loadWasmModule } from "@sweeteditor/core";
import { createWidget } from "@sweeteditor/widget";

const wasm = await loadWasmModule({ modulePath: "/runtime/sweeteditor.js" });
const widget = createWidget(container, wasm, {
  text: "function demo() {}\n",
});
```

## Main exports

- `createWidget(...)`
- `SweetEditor` / `SweetEditorWidget`
- `SweetEditorController`
- Keymap helpers: `EditorKeyMap`, `defaultKeyMap`, `vscode`

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
