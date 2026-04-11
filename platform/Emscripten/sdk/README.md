# OpenSweetEditor Web SDK Workspace

TypeScript-based Web SDK v2 workspace (pnpm).

Current npm line:

- `@sweeteditor/core@0.0.7-rc.1`
- `@sweeteditor/widget@0.0.7-rc.1`
- `@sweeteditor/providers-sweetline@0.0.7-rc.1`
- `@sweeteditor/sdk@0.0.7-rc.1`

## Documentation

- Usage guide (EN): [docs/en/api-platform-web.md](../../../docs/en/api-platform-web.md)
- Full API reference (EN, 100%): [docs/en/api-platform-web-sdk-v2-reference.md](../../../docs/en/api-platform-web-sdk-v2-reference.md)
- 使用指南（中文）: [docs/zh/api-platform-web.md](../../../docs/zh/api-platform-web.md)
- 完整 API 参考（中文，100%）: [docs/zh/api-platform-web-sdk-v2-reference.md](../../../docs/zh/api-platform-web-sdk-v2-reference.md)

## Workspace Layout

```text
platform/Emscripten/sdk
|-- packages
|   |-- core
|   |-- widget
|   |-- providers-sweetline
|   `-- sdk
|-- apps
|   `-- demo
|-- assets
`-- scripts
```

## Architecture Overview

The legacy runtime is now split into focused modules while preserving
backward-compatible entry files:

```text
packages/core/src/legacy
|-- editor-core-legacy.ts                # compatibility re-export entry
|-- editor-core-legacy.internal.ts       # legacy implementation body
|-- text-change-utils.ts                 # text change helpers
|-- document.ts                          # Document/DocumentFactory
|-- web-editor-core.ts                   # WebEditorCore + wasm loader bridge
|-- completion.ts                        # completion subsystem
`-- decoration.ts                        # decoration subsystem

packages/widget/src/legacy
|-- sweet-editor-widget-legacy.ts        # compatibility re-export entry
|-- sweet-editor-widget-legacy.internal.ts
|-- widget-constants.ts
|-- widget-renderer.ts
|-- widget-completion-popup.ts
`-- widget-core.ts
```

Compatibility promise:

- runtime behavior and top-level export names remain stable
- TypeScript type contracts are intentionally tightened in v2 workspace

## Common Commands

```bash
pnpm install
pnpm clean
pnpm lint
pnpm test
pnpm typecheck
pnpm docs:api
pnpm build
pnpm build:web-dist
```

`build:web-dist` writes static output to:

- `platform/Emscripten/web`

## Run Demo

```bash
cd platform/Emscripten/sdk
pnpm install
pnpm --filter @sweeteditor/demo dev
```

Build demo only:

```bash
pnpm --filter @sweeteditor/demo build
```

## Runtime Bundling

`@sweeteditor/sdk` includes bundled runtime files for npm consumers:

- `packages/sdk/runtime/sweeteditor.js`
- `packages/sdk/runtime/sweeteditor.wasm`
- `packages/sdk/runtime/libs/sweetline/*`
- `packages/sdk/runtime/syntaxes/*.json`

By default, `createEditor(...)` uses the bundled runtime automatically when `options.wasm` is omitted.

Helpers exported by `@sweeteditor/sdk`:

- `getBundledWasmModulePath()`
- `getBundledSyntaxPath(name)`

## Browser/CDN Usage (ESM)

Web CDN usage is ESM-first (`<script type="module">`), not global-IIFE style.

```html
<script type="importmap">
{
  "imports": {
    "@sweeteditor/core": "https://cdn.jsdelivr.net/npm/@sweeteditor/core@0.0.7-rc.1/dist/index.js",
    "@sweeteditor/widget": "https://cdn.jsdelivr.net/npm/@sweeteditor/widget@0.0.7-rc.1/dist/index.js",
    "@sweeteditor/sdk": "https://cdn.jsdelivr.net/npm/@sweeteditor/sdk@0.0.7-rc.1/dist/index.js"
  }
}
</script>
```

## Wasm Build Integration

Use existing wasm scripts:

- `platform/Emscripten/build-wasm.ps1`
- `platform/Emscripten/build-wasm.sh`

They build wasm and then trigger pnpm `build:web-dist`.

## Logging Defaults by Build Type

CMake defaults:

- `Debug`: logs/perf logs/debug macro enabled
- `Release`: logs/perf logs/debug macro disabled

Override flags:

- `SWEETEDITOR_ENABLE_LOG`
- `SWEETEDITOR_ENABLE_PERF_LOG`
- `SWEETEDITOR_DEBUG_MODE`

## Migration Guide (Type Changes)

This workspace update tightens public type contracts for `@sweeteditor/sdk`
and `@sweeteditor/widget`.

### 1) snake_case -> camelCase public input

Before:

```ts
const change = { old_text: "a", new_text: "b" };
const keyEvent = { key_code: 13 };
const gestureEvent = { wheel_delta_x: 0, wheel_delta_y: 20, direct_scale: 1 };
```

After:

```ts
const change = { oldText: "a", newText: "b" };
const keyEvent = { keyCode: 13 };
const gestureEvent = { wheelDeltaX: 0, wheelDeltaY: 20, directScale: 1 };
```

Runtime adapters still accept historical snake_case payloads from legacy
bridges, but snake_case is no longer the public TypeScript contract.

### 2) Decoration provider typing is explicit

Before:

```ts
registerDecorationProvider({
  provideDecorations(context: Record<string, any>) {
    return { spansByLine: new Map() };
  },
});
```

After:

```ts
registerDecorationProvider({
  provideDecorations(context) {
    return {
      syntaxSpans: new Map(),
      syntaxSpansMode: 2,
    };
  },
});
```

Use `IDecorationContext` and `IDecorationPatch` exported by `@sweeteditor/sdk`.

### 3) Generic any-like records removed from sdk/widget public surface

Before:

```ts
import type { IAnyRecord } from "@sweeteditor/core";
```

After:

```ts
import type { IPlainObject } from "@sweeteditor/sdk";
// or use Record<string, unknown>
```


