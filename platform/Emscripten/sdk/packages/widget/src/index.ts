import { SweetEditorWidget } from "./legacy/sweet-editor-widget-legacy.js";

export { EditorEventType, SweetEditorWidget } from "./legacy/sweet-editor-widget-legacy.js";

export function createWidget(container: HTMLElement, wasmModule: unknown, options: Record<string, unknown> = {}): InstanceType<typeof SweetEditorWidget> {
  return new SweetEditorWidget(container, wasmModule, options);
}
