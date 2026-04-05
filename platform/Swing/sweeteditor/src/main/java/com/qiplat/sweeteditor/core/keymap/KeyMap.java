package com.qiplat.sweeteditor.core.keymap;

import java.util.HashMap;
import java.util.Map;

public class KeyMap {
    private final Map<KeyBinding, Integer> bindings = new HashMap<>();

    public void addBinding(KeyBinding binding) {
        bindings.put(binding, binding.command);
    }

    public void removeBinding(KeyBinding binding) {
        bindings.remove(binding);
    }

    public Map<KeyBinding, Integer> getBindings() {
        return bindings;
    }
}
