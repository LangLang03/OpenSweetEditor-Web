package com.qiplat.sweeteditor.contextmenu;

import androidx.annotation.NonNull;

import com.qiplat.sweeteditor.SweetEditor;

import java.util.List;

/**
 * Provider interface for building context menu sections.
 */
public interface ContextMenuItemProvider {
    @NonNull
    List<ContextMenuSection> provideMenuItems(@NonNull SweetEditor editor,
                                              @NonNull ContextMenuRequest request);
}
