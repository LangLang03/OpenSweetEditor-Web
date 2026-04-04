package com.qiplat.sweeteditor.event;

import com.qiplat.sweeteditor.core.foundation.TextChange;

import java.util.Collections;
import java.util.List;

/**
 * Text changed event.
 */
public final class TextChangedEvent extends EditorEvent {
    /** Full incremental text changes for the current edit cycle. */
    public final List<TextChange> changes;
    /** Optional coarse action hint. */
    public final TextChangeAction action;

    public TextChangedEvent(List<TextChange> changes, TextChangeAction action) {
        this.changes = changes != null ? Collections.unmodifiableList(changes) : Collections.emptyList();
        this.action = action;
    }
}
