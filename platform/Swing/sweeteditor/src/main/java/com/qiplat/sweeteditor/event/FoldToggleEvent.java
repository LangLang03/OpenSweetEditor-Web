package com.qiplat.sweeteditor.event;

import com.qiplat.sweeteditor.core.visual.PointF;

/**
 * Fold toggle event (triggered when clicking the fold placeholder or fold arrow).
 */
public final class FoldToggleEvent extends EditorEvent {
    public final int line;
    public final boolean isGutter;
    public final PointF screenPoint;

    public FoldToggleEvent(int line, boolean isGutter, PointF screenPoint) {
        this.line = line;
        this.isGutter = isGutter;
        this.screenPoint = screenPoint;
    }
}
