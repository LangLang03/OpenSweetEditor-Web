# Web SDK v1 -> v2 迁移指南

本文档用于将旧版 Web v1 API 迁移到 Web SDK v2。

## 关键变化

1. v2 主包为 `@opensweeteditor/sdk`。
2. 主入口从 `createSweetEditor(...)` 变为 `createEditor(...)`。
3. 引入显式模型层：`createModel(...)`，编辑器与模型解耦。
4. wasm 加载参数统一放入 `options.wasm`。
5. completion/decoration 注册统一返回 `IDisposable`。

## API 对照

| v1 | v2 |
| --- | --- |
| `createSweetEditor(container, options)` | `createEditor(container, options)` |
| `editor.loadText(text)` | `editor.setModel(createModel(text, ...))` 或 `editor.setValue(text)` |
| 平铺 `modulePath/moduleFactory/moduleOptions` | `options.wasm.modulePath/moduleFactory/moduleOptions` |
| `addCompletionProvider` | `registerCompletionProvider` |
| `addDecorationProvider` | `registerDecorationProvider` |

## v1 示例

```ts
import { createSweetEditor } from "./index.js";

const editor = await createSweetEditor(container, {
  modulePath: "./sweeteditor.js",
  locale: "zh-CN"
});
editor.loadText("hello");
```

## v2 示例

```ts
import { createEditor, createModel } from "@opensweeteditor/sdk";

const model = createModel("hello", {
  uri: "inmemory://demo/main.txt",
  language: "plain_text"
});

const editor = await createEditor(container, {
  model,
  locale: "zh-CN",
  wasm: {
    modulePath: "./runtime/sweeteditor.js"
  }
});
```

## SweetLine 迁移

- 使用 `@opensweeteditor/providers-sweetline`。
- 通过 `createSweetLineDecorationProvider(...)` 创建 provider。
- 使用 `editor.registerDecorationProvider(provider)` 注册。
