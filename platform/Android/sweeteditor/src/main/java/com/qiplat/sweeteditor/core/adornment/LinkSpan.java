package com.qiplat.sweeteditor.core.adornment;

import androidx.annotation.NonNull;

/**
 * Clickable document link range embedded in source text.
 */
public final class LinkSpan {
    /** Column anchor within the logical line (0-based, UTF-16 offset). */
    public final int column;
    /** Character length of the link range (UTF-16 units). */
    public final int length;
    /** Resolved link target returned on click. */
    @NonNull
    public final String target;

    public LinkSpan(int column, int length, @NonNull String target) {
        this.column = column;
        this.length = length;
        this.target = target;
    }
}
