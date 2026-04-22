package com.qiplat.sweeteditor.contextmenu;

import android.graphics.drawable.Drawable;

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
    @Nullable public final Drawable icon;
    public final boolean enabled;

    public ContextMenuItem(@NonNull String id, @NonNull String label) {
        this(id, label, null, null, true);
    }

    public ContextMenuItem(@NonNull String id, @NonNull String label, boolean enabled) {
        this(id, label, null, null, enabled);
    }

    public ContextMenuItem(@NonNull String id, @NonNull String label, @Nullable String secondaryLabel) {
        this(id, label, secondaryLabel, null, true);
    }

    public ContextMenuItem(@NonNull String id,
                           @NonNull String label,
                           @Nullable Drawable icon) {
        this(id, label, null, icon, true);
    }

    public ContextMenuItem(@NonNull String id,
                           @NonNull String label,
                           @Nullable Drawable icon,
                           boolean enabled) {
        this(id, label, null, icon, enabled);
    }

    public ContextMenuItem(@NonNull String id,
                           @NonNull String label,
                           @Nullable String secondaryLabel,
                           @Nullable Drawable icon,
                           boolean enabled) {
        this.id = id;
        this.label = label;
        this.secondaryLabel = secondaryLabel;
        this.icon = icon;
        this.enabled = enabled;
    }
}
