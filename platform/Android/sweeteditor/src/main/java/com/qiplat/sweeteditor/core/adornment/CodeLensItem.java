package com.qiplat.sweeteditor.core.adornment;

import androidx.annotation.NonNull;

/**
 * CodeLens item (clickable label above a code line).
 * <p>Items on the same line are ordered by column ascending and displayed above that line.</p>
 */
public final class CodeLensItem {
    /** Column anchor within the logical line (0-based, UTF-16 offset). */
    public final int column;
    /** Display text (e.g. "3 references") */
    @NonNull
    public final String text;
    /** Command ID (platform-defined, passed back on click via HitTarget) */
    public final int commandId;

    /**
     * @param column    Column anchor within the logical line
     * @param text      Display text
     * @param commandId Command ID (platform-defined)
     */
    public CodeLensItem(int column, @NonNull String text, int commandId) {
        this.column = column;
        this.text = text;
        this.commandId = commandId;
    }
}
