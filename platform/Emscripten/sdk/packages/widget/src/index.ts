import { SweetEditorWidget } from "./legacy/sweet-editor-widget-legacy.js";
import type { IAnyRecord, ISweetEditorWasmModule } from "@opensweeteditor/core";

export { EditorEventType, SweetEditorWidget } from "./legacy/sweet-editor-widget-legacy.js";

export function createWidget(
  container: HTMLElement,
  wasmModule: ISweetEditorWasmModule,
  options: IAnyRecord = {},
): InstanceType<typeof SweetEditorWidget> {
  return new SweetEditorWidget(container, wasmModule, options);
}
