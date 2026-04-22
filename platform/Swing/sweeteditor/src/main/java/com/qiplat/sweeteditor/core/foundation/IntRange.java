package com.qiplat.sweeteditor.core.foundation;

public record IntRange(int start, int end) {
    public boolean isEmpty() {
        return end < start;
    }

    public boolean contains(int value) {
        return !isEmpty() && value >= start && value <= end;
    }

    public int length() {
        return isEmpty() ? 0 : (end - start + 1);
    }
}
