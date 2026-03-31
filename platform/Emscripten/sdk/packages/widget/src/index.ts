import { SweetEditorWidget } from "./legacy/sweet-editor-widget-legacy.js";
import type { ISweetEditorWasmModule } from "@sweeteditor/core";

export { EditorEventType, SweetEditorWidget } from "./legacy/sweet-editor-widget-legacy.js";

export interface IWidgetCreateOptions extends Record<string, unknown> {
  locale?: string;
  theme?: Record<string, unknown>;
  decorationOptions?: Record<string, unknown>;
  performanceOverlay?: boolean | Record<string, unknown>;
  text?: string;
  modulePath?: string;
  moduleFactory?: ((options?: Record<string, unknown>) => unknown | Promise<unknown>) | unknown;
  moduleOptions?: Record<string, unknown>;
}

export function createWidget(
  container: HTMLElement,
  wasmModule: ISweetEditorWasmModule,
  options: IWidgetCreateOptions = {},
): InstanceType<typeof SweetEditorWidget> {
  return new SweetEditorWidget(container, wasmModule, options);
}

