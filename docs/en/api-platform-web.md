# Web Platform API (Emscripten, SDK v2)

This document describes the current Web SDK v2 implementation.

## Status

- Web SDK v2 is now organized as a pnpm workspace under `platform/Emscripten/sdk`.
- `platform/Emscripten/web` is now a distribution output directory.
- The old v1 JS entry (`createSweetEditor`) is not the primary API in v2.

## Workspace Layout

```text
platform/Emscripten/sdk
├── packages
│   ├── core                    # low-level core + wasm bridge exports
│   ├── widget                  # browser widget implementation
│   ├── providers-sweetline     # optional SweetLine provider package
│   └── sdk                     # stable v2 public API entry
├── apps
│   └── demo                    # Vite demo app
├── assets                      # sweetline + demo runtime assets
└── scripts/build-web-dist.mjs  # build + sync to platform/Emscripten/web
```

## Build Flow

1. Build wasm as before:

```powershell
./platform/Emscripten/build-wasm.ps1
```

```bash
bash ./platform/Emscripten/build-wasm.sh
```

2. The wasm build script now also:
   - installs/updates pnpm workspace dependencies
   - builds all SDK packages and demo
   - generates static web dist into `platform/Emscripten/web`

You can also run workspace tasks directly:

```bash
cd platform/Emscripten/sdk
pnpm install
pnpm lint
pnpm test
pnpm typecheck
pnpm build:web-dist
```

## v2 Public API

Package: `@opensweeteditor/sdk`

```ts
import {
  createEditor,
  createModel,
  type IEditor,
  type ICompletionProvider,
  type IDecorationProvider
} from "@opensweeteditor/sdk";
```

### `createEditor`

```ts
const model = createModel("hello", {
  uri: "inmemory://demo/example.kt",
  language: "kotlin"
});

const editor = await createEditor(container, {
  model,
  locale: "en",
  wasm: {
    modulePath: "./runtime/sweeteditor.js"
  }
});
```

### `createModel`

- Creates a text model decoupled from the editor instance.
- Supports `uri`, `language`, `versionId`, and text mutation APIs.

### Providers

```ts
const completionDisposable = editor.registerCompletionProvider({
  triggerCharacters: ["."],
  provideCompletions(context, model) {
    return [{ label: "print" }];
  }
});

const decorationDisposable = editor.registerDecorationProvider({
  provideDecorations(context, model) {
    return null;
  }
});
```

Both registration calls return `IDisposable`.

## Optional SweetLine Package

Package: `@opensweeteditor/providers-sweetline`

```ts
import { createSweetLineDecorationProvider } from "@opensweeteditor/providers-sweetline";

const provider = createSweetLineDecorationProvider({
  sweetLine,
  highlightEngine
});
editor.registerDecorationProvider(provider);
```

## Runtime Output (`platform/Emscripten/web`)

After `build:web-dist`:

```text
platform/Emscripten/web
├── index.html
├── assets/*                     # demo bundles
└── runtime
    ├── sweeteditor.js
    ├── sweeteditor.wasm
    ├── libs/sweetline/*
    ├── syntaxes/*.json
    └── files/*
```

Serve this folder with any static server:

```bash
cd platform/Emscripten/web
python -m http.server 8080
```

Open `http://localhost:8080/`.
