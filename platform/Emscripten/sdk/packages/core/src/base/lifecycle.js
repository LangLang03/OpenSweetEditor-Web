class Disposable {
    _onDispose;
    _isDisposed = false;
    constructor(onDispose) {
        this._onDispose = onDispose;
    }
    dispose() {
        if (this._isDisposed) {
            return;
        }
        this._isDisposed = true;
        this._onDispose();
    }
}
export function toDisposable(onDispose) {
    return new Disposable(onDispose);
}
export class DisposableStore {
    _items = new Set();
    _isDisposed = false;
    add(item) {
        if (this._isDisposed) {
            item.dispose();
            return item;
        }
        this._items.add(item);
        return item;
    }
    clear() {
        for (const item of this._items) {
            item.dispose();
        }
        this._items.clear();
    }
    dispose() {
        if (this._isDisposed) {
            return;
        }
        this._isDisposed = true;
        this.clear();
    }
}
//# sourceMappingURL=lifecycle.js.map