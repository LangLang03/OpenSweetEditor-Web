package com.qiplat.sweeteditor.core.keymap;

import java.util.Objects;

public final class KeyChord {
    public static final KeyChord EMPTY = new KeyChord(KeyModifier.NONE, KeyCode.NONE);

    public final int modifiers;
    public final int keyCode;

    public KeyChord(int modifiers, int keyCode) {
        this.modifiers = modifiers;
        this.keyCode = keyCode;
    }

    public boolean empty() {
        return keyCode == KeyCode.NONE;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (!(obj instanceof KeyChord other)) return false;
        return modifiers == other.modifiers && keyCode == other.keyCode;
    }

    @Override
    public int hashCode() {
        return Objects.hash(modifiers, keyCode);
    }
}
