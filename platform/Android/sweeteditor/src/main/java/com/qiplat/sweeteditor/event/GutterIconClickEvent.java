package com.qiplat.sweeteditor.event;

import android.graphics.PointF;

import androidx.annotation.NonNull;

/**
 * Gutter icon click event.
 * <p>Triggered when the user clicks on an icon in the Gutter area.</p>
 */
public final class GutterIconClickEvent extends EditorEvent {
    /** The line number where the icon is located (0-based) */
    public final int line;
    /** Icon ID (consistent with what was passed to setLineGutterIcons) */
    public final int iconId;
    /** Pointer location relative to the editor at the time of click. */
    @NonNull public final PointF locationInEditor;

    public GutterIconClickEvent(int line, int iconId, @NonNull PointF locationInEditor) {
        this.line = line;
        this.iconId = iconId;
        this.locationInEditor = locationInEditor;
    }
}
