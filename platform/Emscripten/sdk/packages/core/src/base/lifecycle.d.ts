export interface IDisposable {
    dispose(): void;
}
export declare function toDisposable(onDispose: () => void): IDisposable;
export declare class DisposableStore implements IDisposable {
    private readonly _items;
    private _isDisposed;
    add<T extends IDisposable>(item: T): T;
    clear(): void;
    dispose(): void;
}
