import { loadSweetEditorCore } from "../legacy/editor-core-legacy.js";

export interface IWasmLoadOptions {
  modulePath?: string;
  moduleFactory?: unknown;
  moduleOptions?: {
    locateFile?: (path: string) => string;
    [key: string]: unknown;
  };
}

export async function loadWasmModule(options: IWasmLoadOptions = {}): Promise<unknown> {
  return loadSweetEditorCore(options as never);
}
