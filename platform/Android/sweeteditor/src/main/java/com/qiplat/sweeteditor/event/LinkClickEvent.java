package com.qiplat.sweeteditor.event;

import android.graphics.PointF;

import androidx.annotation.NonNull;

/**
 * Link click event.
 * <p>Triggered when the user clicks on a document link.</p>
 */
public final class LinkClickEvent extends EditorEvent {
    /** The line number where the link is located (0-based). */
    public final int line;
    /** The column anchor of the clicked link (0-based, UTF-16 offset). */
    public final int column;
    /** The resolved link target. */
    @NonNull public final String target;
    /** Pointer location relative to the editor at the time of click. */
    @NonNull public final PointF locationInEditor;

    public LinkClickEvent(int line, int column, @NonNull String target, @NonNull PointF locationInEditor) {
        this.line = line;
        this.column = column;
        this.target = target;
        this.locationInEditor = locationInEditor;
    }
}
