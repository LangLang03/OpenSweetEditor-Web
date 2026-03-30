import { describe, expect, it } from "vitest";

import { DisposableStore, toDisposable } from "./lifecycle.js";

describe("lifecycle", () => {
  it("disposes all entries once", () => {
    const store = new DisposableStore();
    let counter = 0;
    store.add(toDisposable(() => { counter += 1; }));
    store.add(toDisposable(() => { counter += 1; }));

    store.dispose();
    store.dispose();

    expect(counter).toBe(2);
  });
});
