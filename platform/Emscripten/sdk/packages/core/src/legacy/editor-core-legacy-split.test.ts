import { describe, expect, it } from "vitest";

import * as completion from "./completion.js";
import * as compat from "./editor-core-legacy.js";
import * as decoration from "./decoration.js";
import * as documentApi from "./document.js";
import * as textUtils from "./text-change-utils.js";
import * as webEditor from "./web-editor-core.js";

describe("legacy split exports", () => {
  it("keeps text utility exports stable", () => {
    expect(textUtils.normalizeNewlines).toBe(compat.normalizeNewlines);
    expect(textUtils.applyTextChangesToText).toBe(compat.applyTextChangesToText);
    expect(textUtils.clampVisibleLineRange).toBe(compat.clampVisibleLineRange);
  });

  it("keeps document and editor exports stable", () => {
    expect(documentApi.Document).toBe(compat.Document);
    expect(documentApi.DocumentFactory).toBe(compat.DocumentFactory);
    expect(webEditor.WebEditorCore).toBe(compat.WebEditorCore);
    expect(webEditor.loadSweetEditorCore).toBe(compat.loadSweetEditorCore);
  });

  it("keeps completion and decoration exports stable", () => {
    expect(completion.CompletionProviderManager).toBe(compat.CompletionProviderManager);
    expect(completion.CompletionTriggerKind).toBe(compat.CompletionTriggerKind);
    expect(decoration.DecorationProviderManager).toBe(compat.DecorationProviderManager);
    expect(decoration.SweetLineIncrementalDecorationProvider).toBe(compat.SweetLineIncrementalDecorationProvider);
  });
});
