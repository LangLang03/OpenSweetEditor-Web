import { applyTextChangesToText, normalizeNewlines } from "../legacy/editor-core-legacy.js";
export class TextModel {
    uri;
    language;
    _value;
    _versionId = 1;
    constructor(text, options = {}) {
        this.uri = options.uri ?? "inmemory://model/1";
        this.language = options.language ?? "plain_text";
        this._value = normalizeNewlines(text);
    }
    get versionId() {
        return this._versionId;
    }
    getValue() {
        return this._value;
    }
    setValue(text) {
        const normalized = normalizeNewlines(text);
        if (normalized === this._value) {
            return;
        }
        this._value = normalized;
        this._versionId += 1;
    }
    applyTextChanges(changes) {
        const nextValue = applyTextChangesToText(this._value, changes, {
            normalizeNewlines: true,
        });
        if (nextValue === this._value) {
            return;
        }
        this._value = nextValue;
        this._versionId += 1;
    }
}
export function createTextModel(text, options = {}) {
    return new TextModel(text, options);
}
//# sourceMappingURL=model.js.map