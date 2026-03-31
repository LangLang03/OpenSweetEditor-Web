import { describe, expect, it } from "vitest";

import {
  EditorEventType,
  SweetEditorWidget,
} from "./sweet-editor-widget-legacy.js";
import { CompletionPopupController } from "./widget-completion-popup.js";
import { EditorEventType as SplitEditorEventType } from "./widget-constants.js";
import { SweetEditorWidget as SplitSweetEditorWidget } from "./widget-core.js";
import { Canvas2DRenderer } from "./widget-renderer.js";

describe("widget legacy split exports", () => {
  it("preserves compatibility exports", () => {
    expect(SplitEditorEventType).toBe(EditorEventType);
    expect(SplitSweetEditorWidget).toBe(SweetEditorWidget);
  });

  it("exposes split internals for focused testing", () => {
    expect(typeof Canvas2DRenderer).toBe("function");
    expect(typeof CompletionPopupController).toBe("function");
  });
});
