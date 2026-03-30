export interface IDisposable {
  dispose(): void;
}

class Disposable implements IDisposable {
  private readonly _onDispose: () => void;
  private _isDisposed = false;

  constructor(onDispose: () => void) {
    this._onDispose = onDispose;
  }

  dispose(): void {
    if (this._isDisposed) {
      return;
    }
    this._isDisposed = true;
    this._onDispose();
  }
}

export function toDisposable(onDispose: () => void): IDisposable {
  return new Disposable(onDispose);
}

export class DisposableStore implements IDisposable {
  private readonly _items = new Set<IDisposable>();
  private _isDisposed = false;

  add<T extends IDisposable>(item: T): T {
    if (this._isDisposed) {
      item.dispose();
      return item;
    }
    this._items.add(item);
    return item;
  }

  clear(): void {
    for (const item of this._items) {
      item.dispose();
    }
    this._items.clear();
  }

  dispose(): void {
    if (this._isDisposed) {
      return;
    }
    this._isDisposed = true;
    this.clear();
  }
}
