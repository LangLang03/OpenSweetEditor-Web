# Web 平台 API（Emscripten，SDK v2）

本文档说明当前 Web SDK v2 的实现与使用方式。

## 当前状态

- Web 端已迁移为 `platform/Emscripten/sdk` 下的 pnpm workspace。
- `platform/Emscripten/web` 现在是构建产物目录（可直接静态部署）。
- v2 不再以 v1 的 `createSweetEditor` 作为主入口。

## 目录结构

```text
platform/Emscripten/sdk
├── packages
│   ├── core                    # 低层核心与 wasm bridge
│   ├── widget                  # 浏览器控件层
│   ├── providers-sweetline     # 可选的 SweetLine Provider
│   └── sdk                     # v2 对外稳定入口
├── apps
│   └── demo                    # Vite 演示应用
├── assets                      # sweetline 与 demo 运行时资源
└── scripts/build-web-dist.mjs  # 构建并同步到 platform/Emscripten/web
```

## 构建流程

1. 先构建 wasm（与原流程一致）：

```powershell
./platform/Emscripten/build-wasm.ps1
```

```bash
bash ./platform/Emscripten/build-wasm.sh
```

2. wasm 构建脚本会自动继续执行：
   - 安装/更新 pnpm workspace 依赖
   - 构建 SDK 全部包与 demo
   - 输出静态站点到 `platform/Emscripten/web`

也可手动执行：

```bash
cd platform/Emscripten/sdk
pnpm install
pnpm lint
pnpm test
pnpm typecheck
pnpm build:web-dist
```

## v2 公共 API

包名：`@opensweeteditor/sdk`

```ts
import {
  createEditor,
  createModel,
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
  locale: "zh-CN",
  wasm: {
    modulePath: "./runtime/sweeteditor.js"
  }
});
```

### `createModel`

- 模型与编辑器实例解耦。
- 支持 `uri`、`language`、`versionId` 及文本变更。

### Provider 注册

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

两类注册统一返回 `IDisposable`。

## SweetLine 可选包

包名：`@opensweeteditor/providers-sweetline`

```ts
import { createSweetLineDecorationProvider } from "@opensweeteditor/providers-sweetline";

const provider = createSweetLineDecorationProvider({
  sweetLine,
  highlightEngine
});
editor.registerDecorationProvider(provider);
```

## 产物目录（`platform/Emscripten/web`）

执行 `build:web-dist` 后：

```text
platform/Emscripten/web
├── index.html
├── assets/*                     # demo bundle
└── runtime
    ├── sweeteditor.js
    ├── sweeteditor.wasm
    ├── libs/sweetline/*
    ├── syntaxes/*.json
    └── files/*
```

可直接静态托管：

```bash
cd platform/Emscripten/web
python -m http.server 8080
```

浏览器访问 `http://localhost:8080/`。
