package com.qiplat.sweeteditor.event;

import android.graphics.PointF;

import androidx.annotation.NonNull;

import com.qiplat.sweeteditor.core.foundation.TextPosition;

/** Long press event */
public final class LongPressEvent extends EditorEvent {
    @NonNull public final TextPosition cursorPosition;
    @NonNull public final PointF locationInView;

    public LongPressEvent(@NonNull TextPosition cursorPosition, @NonNull PointF locationInView) {
        this.cursorPosition = cursorPosition;
        this.locationInView = locationInView;
    }
}
