# Avalonia Demo Pack

新增内容：

- `Demo.Shared`：共享示例逻辑与资源
- `Demo`：桌面端 Avalonia 示例
- `Demo.Android`：Android 端 Avalonia 示例

设计目标：

- 统一走 `SweetEditorControl` / `SweetEditorController`
- 覆盖 decorations / completion / inline suggestion / snippet / selection menu / new line action / perf overlay / keymap / 大文档切换
- Android 差异仅收口到平台服务层
