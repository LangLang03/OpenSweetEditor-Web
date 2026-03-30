export interface IModelOptions {
    uri?: string;
    language?: string;
}
export interface ITextModel {
    readonly uri: string;
    readonly language: string;
    readonly versionId: number;
    getValue(): string;
    setValue(text: string): void;
    applyTextChanges(changes: unknown): void;
}
export declare class TextModel implements ITextModel {
    readonly uri: string;
    readonly language: string;
    private _value;
    private _versionId;
    constructor(text: string, options?: IModelOptions);
    get versionId(): number;
    getValue(): string;
    setValue(text: string): void;
    applyTextChanges(changes: unknown): void;
}
export declare function createTextModel(text: string, options?: IModelOptions): TextModel;
