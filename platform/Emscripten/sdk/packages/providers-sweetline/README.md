# @sweeteditor/providers-sweetline

Optional SweetLine decoration provider for OpenSweetEditor Web SDK.

Use this package when you want SweetLine-powered syntax/semantic decoration input
through the standard editor decoration-provider interface.

## Install

```bash
npm i @sweeteditor/providers-sweetline
```

## Quick start

```ts
import { createEditor } from "@sweeteditor/sdk";
import { registerSweetLineDecorationProvider } from "@sweeteditor/providers-sweetline";

const editor = await createEditor(container, { value: "let x = 1;\n" });

const { disposable } = registerSweetLineDecorationProvider(editor, {
  sweetLine,
  highlightEngine,
});

// later
// disposable.dispose();
```

## Main exports

- `createSweetLineDecorationProvider(...)`
- `registerSweetLineDecorationProvider(...)`

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
