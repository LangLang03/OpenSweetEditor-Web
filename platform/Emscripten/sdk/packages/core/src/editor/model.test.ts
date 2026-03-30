import { describe, expect, it } from "vitest";

import { applyTextChangesToText, normalizeNewlines } from "../legacy/editor-core-legacy.js";
import { createTextModel } from "./model.js";

describe("text model", () => {
  it("normalizes line endings", () => {
    expect(normalizeNewlines("a\r\nb\rc")).toBe("a\nb\nc");
  });

  it("applies text changes and bumps version", () => {
    const model = createTextModel("hello");
    expect(model.versionId).toBe(1);

    model.applyTextChanges([
      {
        range: {
          start: { line: 0, column: 5 },
          end: { line: 0, column: 5 },
        },
        newText: " world",
      },
    ]);

    expect(model.getValue()).toBe("hello world");
    expect(model.versionId).toBe(2);
  });

  it("matches standalone text change utility", () => {
    const original = "abc";
    const changes = [
      {
        range: {
          start: { line: 0, column: 1 },
          end: { line: 0, column: 2 },
        },
        newText: "Z",
      },
    ];
    const result = applyTextChangesToText(original, changes);
    expect(result).toBe("aZc");
  });
});
