package com.qiplat.sweeteditor.event;

import android.graphics.PointF;

import androidx.annotation.NonNull;

/**
 * Fold region click event.
 * <p>Triggered when the user clicks on a fold placeholder or gutter fold arrow (C++ layer has already auto-executed toggleFold).</p>
 */
public final class FoldToggleEvent extends EditorEvent {
    /** The line number where the fold region is located (0-based) */
    public final int line;
    /** Whether the click was on the gutter fold arrow (false means click was on the fold placeholder) */
    public final boolean isGutter;
    /** Pointer location relative to the editor at the time of click. */
    @NonNull public final PointF locationInEditor;

    public FoldToggleEvent(int line, boolean isGutter, @NonNull PointF locationInEditor) {
        this.line = line;
        this.isGutter = isGutter;
        this.locationInEditor = locationInEditor;
    }
}
