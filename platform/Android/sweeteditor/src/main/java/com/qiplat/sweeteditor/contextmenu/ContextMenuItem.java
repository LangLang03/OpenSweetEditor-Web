package com.qiplat.sweeteditor.contextmenu;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

/**
 * One context menu item.
 */
public final class ContextMenuItem {
    public static final String ACTION_OPEN_LINK = "open_link";
    public static final String ACTION_COPY_LINK = "copy_link";
    public static final String ACTION_CUT = "cut";
    public static final String ACTION_COPY = "copy";
    public static final String ACTION_PASTE = "paste";
    public static final String ACTION_SELECT_ALL = "select_all";

    @NonNull public final String id;
    @NonNull public final String label;
    @Nullable public final String secondaryLabel;
    public final boolean enabled;

    public ContextMenuItem(@NonNull String id, @NonNull String label) {
        this(id, label, null, true);
    }

    public ContextMenuItem(@NonNull String id, @NonNull String label, boolean enabled) {
        this(id, label, null, enabled);
    }

    public ContextMenuItem(@NonNull String id, @NonNull String label, @Nullable String secondaryLabel) {
        this(id, label, secondaryLabel, true);
    }

    public ContextMenuItem(@NonNull String id,
                           @NonNull String label,
                           @Nullable String secondaryLabel,
                           boolean enabled) {
        this.id = id;
        this.label = label;
        this.secondaryLabel = secondaryLabel;
        this.enabled = enabled;
    }
}
