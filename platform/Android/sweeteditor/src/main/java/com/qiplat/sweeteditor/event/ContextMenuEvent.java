package com.qiplat.sweeteditor.event;

import android.graphics.PointF;

import androidx.annotation.NonNull;

import com.qiplat.sweeteditor.core.foundation.TextPosition;

/**
 * Right-click/context menu event.
 */
public final class ContextMenuEvent extends EditorEvent {
    @NonNull
    public final TextPosition cursorPosition;
    @NonNull
    public final PointF locationInView;

    public ContextMenuEvent(@NonNull TextPosition cursorPosition, @NonNull PointF locationInView) {
        this.cursorPosition = cursorPosition;
        this.locationInView = locationInView;
    }
}
