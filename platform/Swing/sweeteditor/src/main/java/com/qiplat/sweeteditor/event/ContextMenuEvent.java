package com.qiplat.sweeteditor.event;

import com.qiplat.sweeteditor.core.foundation.TextPosition;
import com.qiplat.sweeteditor.core.visual.PointF;

/**
 * Right-click/context menu event.
 */
public final class ContextMenuEvent extends EditorEvent {
    public final TextPosition cursorPosition;
    public final PointF screenPoint;

    public ContextMenuEvent(TextPosition cursorPosition, PointF screenPoint) {
        this.cursorPosition = cursorPosition;
        this.screenPoint = screenPoint;
    }
}
