package com.qiplat.sweeteditor.core.adornment;

/**
 * Immutable value object representing a clickable link span on a single line.
 */
public final class LinkSpan {
    /** Starting column (0-based, UTF-16 offset). */
    public final int column;
    /** Character length of the clickable range. */
    public final int length;
    /** Link target payload returned on click. */
    public final String target;

    public LinkSpan(int column, int length, String target) {
        this.column = column;
        this.length = length;
        this.target = target;
    }
}
