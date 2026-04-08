package com.qiplat.sweeteditor.event;

import android.graphics.PointF;

import androidx.annotation.NonNull;

/**
 * CodeLens click event.
 * <p>Triggered when the user clicks on a CodeLens item.</p>
 */
public final class CodeLensClickEvent extends EditorEvent {
    /** The line number where the CodeLens is located (0-based) */
    public final int line;
    /** Command ID (consistent with what was passed via CodeLensItem) */
    public final int commandId;
    /** Screen coordinates at the time of click */
    @NonNull public final PointF screenPoint;

    public CodeLensClickEvent(int line, int commandId, @NonNull PointF screenPoint) {
        this.line = line;
        this.commandId = commandId;
        this.screenPoint = screenPoint;
    }
}
