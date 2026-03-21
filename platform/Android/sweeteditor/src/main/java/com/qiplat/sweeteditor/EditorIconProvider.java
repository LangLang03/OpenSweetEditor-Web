package com.qiplat.sweeteditor;

import android.graphics.drawable.Drawable;

import androidx.annotation.Nullable;

/**
 * Icon provider interface for gutter icons and InlayHint ICON types.
 */
public interface EditorIconProvider {
    @Nullable
    Drawable getIconDrawable(int iconId);
}