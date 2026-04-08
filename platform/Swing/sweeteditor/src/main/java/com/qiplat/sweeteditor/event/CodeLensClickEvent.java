package com.qiplat.sweeteditor.event;

import com.qiplat.sweeteditor.core.visual.PointF;

/**
 * CodeLens click event.
 * <p>Triggered when the user clicks on a CodeLens item.</p>
 */
public final class CodeLensClickEvent extends EditorEvent {
    /** Line number where the CodeLens is located (0-based) */
    public final int line;
    /** Command ID */
    public final int commandId;
    public final PointF screenPoint;

    public CodeLensClickEvent(int line, int commandId, PointF screenPoint) {
        this.line = line;
        this.commandId = commandId;
        this.screenPoint = screenPoint;
    }
}
