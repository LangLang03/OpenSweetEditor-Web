import { SweetEditorWidget } from "./legacy/sweet-editor-widget-legacy.js";
import type { ISweetEditorWasmModule } from "@sweeteditor/core";
import type { SweetEditorController } from "./sweet-editor-controller.js";
import { SweetEditor } from "./sweet-editor.js";
import type { EditorTheme } from "./platform-standard-types.js";

export { EditorEventType, SweetEditorWidget } from "./legacy/sweet-editor-widget-legacy.js";
export { SweetEditor } from "./sweet-editor.js";
export { SweetEditorController } from "./sweet-editor-controller.js";
export * from "./platform-standard-types.js";

export interface IWidgetCreateOptions extends Record<string, unknown> {
  locale?: string;
  theme?: Partial<EditorTheme>;
  decorationOptions?: Record<string, unknown>;
  performanceOverlay?: boolean | Record<string, unknown>;
  text?: string;
  controller?: SweetEditorController;
  modulePath?: string;
  moduleFactory?: ((options?: Record<string, unknown>) => unknown | Promise<unknown>) | unknown;
  moduleOptions?: Record<string, unknown>;
}

export function createWidget(
  container: HTMLElement,
  wasmModule: ISweetEditorWasmModule,
  options: IWidgetCreateOptions = {},
): InstanceType<typeof SweetEditorWidget> {
  return new SweetEditor(container, wasmModule, options);
}

