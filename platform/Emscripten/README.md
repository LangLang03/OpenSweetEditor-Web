# SweetEditor Web Platform (Emscripten, SDK v2)

> Status: Testing phase. API may continue evolving.

This platform now ships a pnpm + TypeScript Web SDK workspace and a static web distribution pipeline.

## What Changed in v2

- Web implementation moved to `platform/Emscripten/sdk` workspace.
- `platform/Emscripten/web` is now build output only.
- Public API now comes from `@sweeteditor/sdk` (`createEditor`, `createModel`).
- SweetLine integration is available via `@sweeteditor/providers-sweetline`.

## Workspace Layout

```text
platform/Emscripten/sdk
├── packages
│   ├── core
│   ├── widget
│   ├── providers-sweetline
│   └── sdk
├── apps
│   └── demo
├── assets
└── scripts/build-web-dist.mjs
```

## Build

### Windows (PowerShell)

```powershell
./platform/Emscripten/build-wasm.ps1
```

### macOS / Linux

```bash
bash ./platform/Emscripten/build-wasm.sh
```

The wasm script now also triggers the SDK build pipeline and outputs static files to:

- `platform/Emscripten/web/index.html`
- `platform/Emscripten/web/assets/*`
- `platform/Emscripten/web/runtime/*`

## Manual SDK Commands

```bash
cd platform/Emscripten/sdk
pnpm install
pnpm lint
pnpm test
pnpm typecheck
pnpm build:web-dist
```

## Run the Web Demo

```bash
cd platform/Emscripten/web
python -m http.server 8080
```

Then open `http://localhost:8080/`.

## v2 API Quick Example

```ts
import { createEditor, createModel, getBundledWasmModulePath } from "@sweeteditor/sdk";

const model = createModel("Hello", {
  uri: "inmemory://demo/main.kt",
  language: "kotlin",
});

const editor = await createEditor(container, {
  model,
  // Optional: v2 defaults to bundled runtime from @sweeteditor/sdk/runtime.
  wasm: {
    modulePath: getBundledWasmModulePath(),
  },
});
```

## Related Docs

- `docs/en/api-platform-web.md`
- `docs/zh/api-platform-web.md`
- `docs/en/web-sdk-v2-migration.md`
- `docs/zh/web-sdk-v2-migration.md`

