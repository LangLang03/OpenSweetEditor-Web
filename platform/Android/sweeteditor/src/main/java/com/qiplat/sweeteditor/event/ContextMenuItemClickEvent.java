package com.qiplat.sweeteditor.event;

import androidx.annotation.NonNull;

import com.qiplat.sweeteditor.contextmenu.ContextMenuItem;
import com.qiplat.sweeteditor.contextmenu.ContextMenuRequest;

/**
 * Published when a custom context menu item is clicked.
 */
public final class ContextMenuItemClickEvent extends EditorEvent {
    @NonNull public final ContextMenuItem item;
    @NonNull public final ContextMenuRequest request;

    public ContextMenuItemClickEvent(@NonNull ContextMenuItem item,
                                     @NonNull ContextMenuRequest request) {
        this.item = item;
        this.request = request;
    }
}
