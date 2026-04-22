package com.qiplat.sweeteditor.core.foundation;

import androidx.annotation.NonNull;

/**
 * Inclusive integer range.
 */
public final class IntRange {
    public final int start;
    public final int end;

    public IntRange(int start, int end) {
        this.start = start;
        this.end = end;
    }

    public boolean isEmpty() {
        return end < start;
    }

    public boolean contains(int value) {
        return !isEmpty() && value >= start && value <= end;
    }

    public int length() {
        return isEmpty() ? 0 : (end - start + 1);
    }

    @NonNull
    @Override
    public String toString() {
        return "IntRange{" +
                "start=" + start +
                ", end=" + end +
                '}';
    }
}
