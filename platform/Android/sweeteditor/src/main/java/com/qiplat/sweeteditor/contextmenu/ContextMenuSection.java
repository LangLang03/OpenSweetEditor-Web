package com.qiplat.sweeteditor.contextmenu;

import androidx.annotation.NonNull;

import java.util.ArrayList;
import java.util.List;

/**
 * One visual section inside the context menu.
 */
public final class ContextMenuSection {
    @NonNull public final List<ContextMenuItem> items;

    public ContextMenuSection(@NonNull List<ContextMenuItem> items) {
        this.items = new ArrayList<>(items);
    }
}
