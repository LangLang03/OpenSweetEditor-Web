export * from "./base/lifecycle.js";
export * from "./editor/model.js";
export * from "./platform/wasm.js";
// Legacy exports are still available at the low-level core package so v2 SDK
// can build a typed façade on top while we continue to reuse battle-tested
// Emscripten bridge code.
export * from "./legacy/editor-core-legacy.js";
//# sourceMappingURL=index.js.map