# @sweeteditor/sdk

Stable public entry for OpenSweetEditor Web SDK.

This is the recommended package for normal application integration.

## Install

```bash
npm i @sweeteditor/sdk
```

## Quick start

```ts
import { createEditor, createModel } from "@sweeteditor/sdk";

const model = createModel("int main() {\n  return 0;\n}\n", {
  uri: "inmemory://demo/main.cpp",
  language: "cpp",
});

const editor = await createEditor(container, { model });
```

## Runtime

If `options.wasm` is omitted, bundled runtime assets are used automatically:

- `runtime/sweeteditor.js`
- `runtime/sweeteditor.wasm`
- `runtime/libs/sweetline/*`
- `runtime/syntaxes/*.json`

Helpers:

- `getBundledWasmModulePath()`
- `getBundledSyntaxPath(name)`

## Optional SweetLine provider

You can use `@sweeteditor/providers-sweetline` for decoration-provider integration.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
