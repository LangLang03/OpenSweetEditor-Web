package com.qiplat.sweeteditor.event;

import com.qiplat.sweeteditor.core.visual.PointF;

/**
 * Link click event.
 * <p>Triggered when the user clicks on an embedded document link.</p>
 */
public final class LinkClickEvent extends EditorEvent {
    /** Line number where the link is located (0-based) */
    public final int line;
    /** Column anchor of the clicked link (0-based, UTF-16 offset) */
    public final int column;
    /** Link target payload returned by the core */
    public final String target;
    public final PointF screenPoint;

    public LinkClickEvent(int line, int column, String target, PointF screenPoint) {
        this.line = line;
        this.column = column;
        this.target = target;
        this.screenPoint = screenPoint;
    }
}
