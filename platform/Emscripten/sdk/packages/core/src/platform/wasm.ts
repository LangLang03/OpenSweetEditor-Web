import { loadSweetEditorCore } from "../legacy/web-editor-core.js";
import type { IAnyRecord, ISweetEditorWasmModule } from "../legacy/embind-contracts.js";

export interface IWasmModuleOptions extends IAnyRecord {
  locateFile?: (path: string) => string;
}

export type IWasmModuleFactory =
  (options: IWasmModuleOptions) => ISweetEditorWasmModule | Promise<ISweetEditorWasmModule>;

export interface IWasmLoadOptions {
  modulePath?: string;
  moduleFactory?: IWasmModuleFactory;
  moduleOptions?: IWasmModuleOptions;
}

export async function loadWasmModule(options: IWasmLoadOptions = {}): Promise<ISweetEditorWasmModule> {
  return loadSweetEditorCore(options as never) as Promise<ISweetEditorWasmModule>;
}
