export * from "./base/lifecycle.js";
export * from "./editor/model.js";
export * from "./platform/wasm.js";
export * from "./legacy/embind-contracts.js";
export * from "./legacy/editor-input-types.js";

// Legacy exports are still available at the low-level core package so v2 SDK
// can build a typed facade on top while we continue to reuse battle-tested
// Emscripten bridge code.
export * from "./legacy/editor-core-legacy.js";
