package com.qiplat.sweeteditor;

import java.awt.*;

/**
 * Icon provider interface for gutter icons and InlayHint ICON types.
 */
public interface EditorIconProvider {
    Image getIconImage(int iconId);
}