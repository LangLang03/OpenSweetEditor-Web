export interface IWasmLoadOptions {
    modulePath?: string;
    moduleFactory?: unknown;
    moduleOptions?: {
        locateFile?: (path: string) => string;
        [key: string]: unknown;
    };
}
export declare function loadWasmModule(options?: IWasmLoadOptions): Promise<unknown>;
