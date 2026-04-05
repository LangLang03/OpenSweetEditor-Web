package com.qiplat.sweeteditor.event;

import com.qiplat.sweeteditor.core.foundation.TextPosition;
import com.qiplat.sweeteditor.core.visual.PointF;

/**
 * Long press event.
 */
public final class LongPressEvent extends EditorEvent {
    public final TextPosition cursorPosition;
    public final PointF screenPoint;

    public LongPressEvent(TextPosition cursorPosition, PointF screenPoint) {
        this.cursorPosition = cursorPosition;
        this.screenPoint = screenPoint;
    }
}
