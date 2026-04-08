package com.qiplat.sweeteditor.core.adornment;

import androidx.annotation.NonNull;

/**
 * Immutable value object representing a single CodeLens item on a line.
 * <p>
 * CodeLens items are clickable labels rendered above a code line
 * (e.g. "3 references", "Run", "Debug"). Each item carries a command ID
 * that is transparently passed back to the platform on click.
 */
public final class CodeLensItem {
    /** Display text (e.g. "3 references") */
    @NonNull
    public final String text;
    /** Command ID (platform-defined, passed back on click via HitTarget) */
    public final int commandId;

    /**
     * @param text      Display text
     * @param commandId Command ID (platform-defined)
     */
    public CodeLensItem(@NonNull String text, int commandId) {
        this.text = text;
        this.commandId = commandId;
    }
}
