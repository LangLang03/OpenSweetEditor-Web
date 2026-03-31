import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  DecorationApplyMode,
  DecorationProvider,
  DecorationProviderManager,
  DecorationResult,
  DecorationTextChangeMode,
  applyTextChangesToText,
  normalizeNewlines,
} from "./editor-core-legacy.js";
import type { DecorationReceiver } from "./editor-core-legacy.js";

interface ITextPoint {
  line: number;
  column: number;
}

interface ITextRange {
  start: ITextPoint;
  end: ITextPoint;
}

interface ITextChangeLike {
  range: ITextRange;
  oldText: string;
  newText: string;
}

interface ILineRange {
  start: number;
  end: number;
}

interface IRenderPassMetrics {
  elapsedMs: number;
  processedLines: number;
  processedChars: number;
  checksum: number;
}

interface IScenarioMetrics extends IRenderPassMetrics {
  passes: number;
}

interface IDecorationContextLike {
  visibleStartLine?: number;
  visibleEndLine?: number;
  textChanges?: ITextChangeLike[];
}

interface IManagerRefreshInternals {
  _pendingTextChanges: ITextChangeLike[];
  _doRefresh: () => void;
}

interface IManagerTimerInternals {
  _refreshTimer: ReturnType<typeof setTimeout> | 0;
  _scrollRefreshTimer: ReturnType<typeof setTimeout> | 0;
  _applyTimer: ReturnType<typeof setTimeout> | 0;
}

class ViewJavaRenderBenchmarkProvider extends DecorationProvider {
  _sourceText: string;
  _lines: string[];
  _lastRun: IRenderPassMetrics;

  constructor(sourceText: string) {
    super();
    this._sourceText = normalizeNewlines(sourceText);
    this._lines = this._sourceText.split("\n");
    this._lastRun = {
      elapsedMs: 0,
      processedLines: 0,
      processedChars: 0,
      checksum: 0,
    };
  }

  get lineCount() {
    return this._lines.length;
  }

  get lastRun() {
    return this._lastRun;
  }

  provideDecorations(context: unknown, receiver: DecorationReceiver) {
    const contextLike = (context ?? {}) as IDecorationContextLike;
    const startedAt = performance.now();
    const changes = Array.isArray(contextLike.textChanges) ? contextLike.textChanges : [];
    if (changes.length > 0) {
      this._sourceText = applyTextChangesToText(this._sourceText, changes);
      this._lines = this._sourceText.split("\n");
    }

    const totalLineCount = Math.max(1, this._lines.length);
    const visibleStart = clampLine(contextLike.visibleStartLine ?? 0, totalLineCount);
    const visibleEnd = clampLine(
      Math.max(visibleStart - 1, toInt(contextLike.visibleEndLine, visibleStart - 1)),
      totalLineCount,
    );
    const renderRanges = this._resolveRenderRanges(visibleStart, visibleEnd, changes);
    const syntaxSpans = new Map<number, Array<{ column: number; length: number; styleId: number }>>();

    let processedLines = 0;
    let processedChars = 0;
    let checksum = 0;

    renderRanges.forEach((range) => {
      for (let line = range.start; line <= range.end; line += 1) {
        const text = this._lines[line] ?? "";
        const spans = this._buildLineSpans(text);
        syntaxSpans.set(line, spans);

        processedLines += 1;
        processedChars += text.length;
        checksum ^= ((line + 1) * 131) ^ (spans.length * 17) ^ text.length;
      }
    });

    receiver.accept(
      new DecorationResult({
        syntaxSpans,
        syntaxSpansMode: DecorationApplyMode.REPLACE_RANGE,
      }),
    );

    this._lastRun = {
      elapsedMs: performance.now() - startedAt,
      processedLines,
      processedChars,
      checksum,
    };
  }

  _resolveRenderRanges(visibleStart: number, visibleEnd: number, changes: ITextChangeLike[]) {
    if (visibleEnd < visibleStart) {
      return [] as ILineRange[];
    }

    if (changes.length === 0) {
      return [{ start: visibleStart, end: visibleEnd }];
    }

    const patchRanges: ILineRange[] = [];
    changes.forEach((change) => {
      const startLine = Math.max(0, toInt(change.range.start.line, 0));
      const endLine = Math.max(startLine, toInt(change.range.end.line, startLine));
      const start = Math.max(visibleStart, startLine - 2);
      const end = Math.min(visibleEnd, endLine + 2);
      if (end >= start) {
        patchRanges.push({ start, end });
      }
    });

    if (patchRanges.length === 0) {
      return [];
    }
    return mergeLineRanges(patchRanges);
  }

  _buildLineSpans(text: string) {
    const spans: Array<{ column: number; length: number; styleId: number }> = [];
    let runStart = -1;

    for (let i = 0; i <= text.length; i += 1) {
      const code = i < text.length ? text.charCodeAt(i) : 32;
      const isWord =
        (code >= 48 && code <= 57)
        || (code >= 65 && code <= 90)
        || (code >= 97 && code <= 122)
        || code === 95;
      if (isWord) {
        if (runStart < 0) {
          runStart = i;
        }
        continue;
      }

      if (runStart < 0) {
        continue;
      }

      const length = i - runStart;
      if (length > 0) {
        spans.push({
          column: runStart,
          length,
          styleId: (length % 6) + 1,
        });
      }
      runStart = -1;
      if (spans.length >= 24) {
        break;
      }
    }

    if (spans.length === 0 && text.length > 0) {
      spans.push({
        column: 0,
        length: 1,
        styleId: 1,
      });
    }

    return spans;
  }
}

function toInt(value: unknown, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.trunc(n);
}

function clampLine(line: number, totalLineCount: number) {
  const total = Math.max(1, toInt(totalLineCount, 1));
  const value = Math.max(0, toInt(line, 0));
  return Math.min(total - 1, value);
}

function cloneChange(change: ITextChangeLike): ITextChangeLike {
  return {
    range: {
      start: {
        line: toInt(change.range.start.line, 0),
        column: Math.max(0, toInt(change.range.start.column, 0)),
      },
      end: {
        line: toInt(change.range.end.line, 0),
        column: Math.max(0, toInt(change.range.end.column, 0)),
      },
    },
    oldText: String(change.oldText ?? ""),
    newText: String(change.newText ?? ""),
  };
}

function mergeLineRanges(ranges: ILineRange[]) {
  if (ranges.length === 0) {
    return [] as ILineRange[];
  }

  const sorted = ranges
    .slice()
    .sort((a, b) => (a.start - b.start) || (a.end - b.end));
  const first = sorted[0];
  if (!first) {
    return [];
  }
  const merged: ILineRange[] = [{ start: first.start, end: first.end }];

  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i];
    const tail = merged[merged.length - 1];
    if (!current || !tail) {
      continue;
    }
    if (current.start <= (tail.end + 1)) {
      tail.end = Math.max(tail.end, current.end);
      continue;
    }
    merged.push({ start: current.start, end: current.end });
  }

  return merged;
}

function flushManagerTimers(manager: DecorationProviderManager) {
  const internals = manager as unknown as IManagerTimerInternals;
  if (internals._refreshTimer) {
    clearTimeout(internals._refreshTimer);
    internals._refreshTimer = 0;
  }
  if (internals._scrollRefreshTimer) {
    clearTimeout(internals._scrollRefreshTimer);
    internals._scrollRefreshTimer = 0;
  }
  if (internals._applyTimer) {
    clearTimeout(internals._applyTimer);
    internals._applyTimer = 0;
  }
}

function runRefresh(manager: DecorationProviderManager, changes: ITextChangeLike[] = []) {
  const internals = manager as unknown as IManagerRefreshInternals;
  if (changes.length > 0) {
    internals._pendingTextChanges.push(...changes.map(cloneChange));
  }

  const startedAt = performance.now();
  internals._doRefresh();
  return performance.now() - startedAt;
}

function createChanges(lineCount: number, visibleStart: number, visibleEnd: number, count: number) {
  const total = Math.max(1, toInt(lineCount, 1));
  const start = clampLine(visibleStart, total);
  const end = clampLine(Math.max(start, visibleEnd), total);
  const span = Math.max(1, end - start + 1);

  const changes: ITextChangeLike[] = [];
  for (let i = 0; i < count; i += 1) {
    const line = Math.min(total - 1, start + ((i * 97) % span));
    const column = (i % 9) + 1;
    changes.push({
      range: {
        start: { line, column },
        end: { line, column },
      },
      oldText: "",
      newText: `seed_${i.toString(36)}`,
    });
  }
  return changes;
}

type IDecorationTextChangeMode = (typeof DecorationTextChangeMode)[keyof typeof DecorationTextChangeMode];

function createHarness(mode: IDecorationTextChangeMode, sourceText: string, visibleStart: number, visibleEnd: number) {
  const provider = new ViewJavaRenderBenchmarkProvider(sourceText);
  const visibleRange = {
    start: visibleStart,
    end: visibleEnd,
  };
  const manager = new DecorationProviderManager({
    getVisibleLineRange: () => ({
      start: visibleRange.start,
      end: visibleRange.end,
    }),
    getTotalLineCount: () => provider.lineCount,
    textChangeMode: mode,
    overscanViewportMultiplier: 0,
    applySynchronously: true,
  });

  manager.addProvider(provider);
  flushManagerTimers(manager);

  return {
    manager,
    provider,
    visibleRange,
  };
}

function runSegmentedScenario(sourceText: string, lineCount: number, chunkSize: number): IScenarioMetrics {
  const harness = createHarness(DecorationTextChangeMode.FULL, sourceText, 0, 0);
  let passes = 0;
  let elapsedMs = 0;
  let processedLines = 0;
  let processedChars = 0;
  let checksum = 0;

  try {
    for (let start = 0; start < lineCount; start += chunkSize) {
      harness.visibleRange.start = start;
      harness.visibleRange.end = Math.min(lineCount - 1, start + chunkSize - 1);
      elapsedMs += runRefresh(harness.manager);
      passes += 1;
      processedLines += harness.provider.lastRun.processedLines;
      processedChars += harness.provider.lastRun.processedChars;
      checksum ^= harness.provider.lastRun.checksum;
    }
  } finally {
    flushManagerTimers(harness.manager);
  }

  return {
    passes,
    elapsedMs,
    processedLines,
    processedChars,
    checksum,
  };
}

function runTextChangeScenario(
  mode: IDecorationTextChangeMode,
  sourceText: string,
  visibleStart: number,
  visibleEnd: number,
  changes: ITextChangeLike[],
) {
  const harness = createHarness(mode, sourceText, visibleStart, visibleEnd);
  let passes = 0;
  let elapsedMs = 0;
  let processedLines = 0;
  let processedChars = 0;
  let checksum = 0;

  try {
    runRefresh(harness.manager);
    changes.forEach((change) => {
      elapsedMs += runRefresh(harness.manager, [change]);
      passes += 1;
      processedLines += harness.provider.lastRun.processedLines;
      processedChars += harness.provider.lastRun.processedChars;
      checksum ^= harness.provider.lastRun.checksum;
    });
  } finally {
    flushManagerTimers(harness.manager);
  }

  return {
    passes,
    elapsedMs,
    processedLines,
    processedChars,
    checksum,
  };
}

function toMetricsLog(metrics: IScenarioMetrics) {
  return {
    passes: metrics.passes,
    elapsedMs: Number(metrics.elapsedMs.toFixed(3)),
    avgMsPerPass: Number((metrics.elapsedMs / Math.max(1, metrics.passes)).toFixed(3)),
    processedLines: metrics.processedLines,
    processedChars: metrics.processedChars,
    checksum: metrics.checksum,
  };
}

describe("View.java web render performance", () => {
  it("captures segmented, incremental and full render timing", () => {
    const testDir = dirname(fileURLToPath(import.meta.url));
    const viewJavaPath = resolve(testDir, "../../../../assets/demo-files/View.java");
    const viewJavaText = normalizeNewlines(readFileSync(viewJavaPath, "utf8"));
    const lineCount = viewJavaText.split("\n").length;

    const segmented = runSegmentedScenario(viewJavaText, lineCount, 1200);

    const visibleStart = Math.min(800, Math.max(0, lineCount - 1));
    const visibleEnd = Math.min(lineCount - 1, visibleStart + 2399);
    const changes = createChanges(lineCount, visibleStart, visibleEnd, 24);

    const incremental = runTextChangeScenario(
      DecorationTextChangeMode.INCREMENTAL,
      viewJavaText,
      visibleStart,
      visibleEnd,
      changes,
    );
    const full = runTextChangeScenario(
      DecorationTextChangeMode.FULL,
      viewJavaText,
      visibleStart,
      visibleEnd,
      changes,
    );

    const report = {
      segmented: toMetricsLog(segmented),
      incremental: toMetricsLog(incremental),
      full: toMetricsLog(full),
    };
    console.info(`[View.java render benchmark] ${JSON.stringify(report)}`);

    expect(segmented.passes).toBeGreaterThan(1);
    expect(segmented.processedLines).toBeGreaterThanOrEqual(lineCount);
    expect(segmented.elapsedMs).toBeGreaterThanOrEqual(0);

    expect(incremental.passes).toBe(changes.length);
    expect(incremental.elapsedMs).toBeGreaterThanOrEqual(0);

    expect(full.passes).toBe(changes.length);
    expect(full.elapsedMs).toBeGreaterThanOrEqual(0);

    expect(full.processedLines).toBeGreaterThan(incremental.processedLines);
    expect(full.processedChars).toBeGreaterThan(incremental.processedChars);
  });
});
