package com.qiplat.sweeteditor;

import com.qiplat.sweeteditor.core.keymap.EditorCommand;
import com.qiplat.sweeteditor.core.keymap.KeyBinding;
import com.qiplat.sweeteditor.core.keymap.KeyCode;
import com.qiplat.sweeteditor.core.keymap.KeyMap;
import com.qiplat.sweeteditor.core.keymap.KeyModifier;

import java.util.HashMap;
import java.util.Map;

public class EditorKeyMap extends KeyMap {
    private final Map<Integer, EditorCommand<SweetEditor>> commands = new HashMap<>();
    private int nextCustomId = EditorCommand.BUILT_IN_MAX + 1;

    public int registerCommand(KeyBinding binding, EditorCommand<SweetEditor> handler) {
        int commandId = binding.command;
        KeyBinding resolvedBinding = binding;
        if (commandId == EditorCommand.NONE) {
            commandId = nextCustomId++;
            resolvedBinding = new KeyBinding(binding.first, binding.second, commandId);
        } else if (commandId >= nextCustomId) {
            nextCustomId = commandId + 1;
        }
        commands.put(commandId, handler);
        addBinding(resolvedBinding);
        return commandId;
    }

    public EditorCommand<SweetEditor> getCommand(int commandId) {
        return commands.get(commandId);
    }

    private static void bind(EditorKeyMap keyMap, int modifiers, int keyCode, int command) {
        keyMap.addBinding(new KeyBinding(modifiers, keyCode, command));
    }

    private static void addCommonBindings(EditorKeyMap keyMap) {
        bind(keyMap, KeyModifier.NONE, KeyCode.LEFT, EditorCommand.CURSOR_LEFT);
        bind(keyMap, KeyModifier.NONE, KeyCode.RIGHT, EditorCommand.CURSOR_RIGHT);
        bind(keyMap, KeyModifier.NONE, KeyCode.UP, EditorCommand.CURSOR_UP);
        bind(keyMap, KeyModifier.NONE, KeyCode.DOWN, EditorCommand.CURSOR_DOWN);
        bind(keyMap, KeyModifier.NONE, KeyCode.HOME, EditorCommand.CURSOR_LINE_START);
        bind(keyMap, KeyModifier.NONE, KeyCode.END, EditorCommand.CURSOR_LINE_END);
        bind(keyMap, KeyModifier.NONE, KeyCode.PAGE_UP, EditorCommand.CURSOR_PAGE_UP);
        bind(keyMap, KeyModifier.NONE, KeyCode.PAGE_DOWN, EditorCommand.CURSOR_PAGE_DOWN);

        bind(keyMap, KeyModifier.SHIFT, KeyCode.LEFT, EditorCommand.SELECT_LEFT);
        bind(keyMap, KeyModifier.SHIFT, KeyCode.RIGHT, EditorCommand.SELECT_RIGHT);
        bind(keyMap, KeyModifier.SHIFT, KeyCode.UP, EditorCommand.SELECT_UP);
        bind(keyMap, KeyModifier.SHIFT, KeyCode.DOWN, EditorCommand.SELECT_DOWN);
        bind(keyMap, KeyModifier.SHIFT, KeyCode.HOME, EditorCommand.SELECT_LINE_START);
        bind(keyMap, KeyModifier.SHIFT, KeyCode.END, EditorCommand.SELECT_LINE_END);
        bind(keyMap, KeyModifier.SHIFT, KeyCode.PAGE_UP, EditorCommand.SELECT_PAGE_UP);
        bind(keyMap, KeyModifier.SHIFT, KeyCode.PAGE_DOWN, EditorCommand.SELECT_PAGE_DOWN);

        bind(keyMap, KeyModifier.NONE, KeyCode.BACKSPACE, EditorCommand.BACKSPACE);
        bind(keyMap, KeyModifier.NONE, KeyCode.DELETE_KEY, EditorCommand.DELETE_FORWARD);
        bind(keyMap, KeyModifier.NONE, KeyCode.TAB, EditorCommand.INSERT_TAB);
        bind(keyMap, KeyModifier.NONE, KeyCode.ENTER, EditorCommand.INSERT_NEWLINE);

        bind(keyMap, KeyModifier.CTRL, KeyCode.A, EditorCommand.SELECT_ALL);
        bind(keyMap, KeyModifier.META, KeyCode.A, EditorCommand.SELECT_ALL);

        bind(keyMap, KeyModifier.CTRL, KeyCode.Z, EditorCommand.UNDO);
        bind(keyMap, KeyModifier.META, KeyCode.Z, EditorCommand.UNDO);

        keyMap.registerCommand(
                new KeyBinding(KeyModifier.CTRL, KeyCode.C, EditorCommand.COPY),
                (binding, editor) -> editor.copyToClipboard());
        keyMap.registerCommand(
                new KeyBinding(KeyModifier.META, KeyCode.C, EditorCommand.COPY),
                (binding, editor) -> editor.copyToClipboard());
        keyMap.registerCommand(
                new KeyBinding(KeyModifier.CTRL, KeyCode.V, EditorCommand.PASTE),
                (binding, editor) -> editor.pasteFromClipboard());
        keyMap.registerCommand(
                new KeyBinding(KeyModifier.META, KeyCode.V, EditorCommand.PASTE),
                (binding, editor) -> editor.pasteFromClipboard());
        keyMap.registerCommand(
                new KeyBinding(KeyModifier.CTRL, KeyCode.X, EditorCommand.CUT),
                (binding, editor) -> editor.cutToClipboard());
        keyMap.registerCommand(
                new KeyBinding(KeyModifier.META, KeyCode.X, EditorCommand.CUT),
                (binding, editor) -> editor.cutToClipboard());

        keyMap.registerCommand(
                new KeyBinding(KeyModifier.CTRL, KeyCode.SPACE, EditorCommand.TRIGGER_COMPLETION),
                (binding, editor) -> editor.triggerCompletion());
        keyMap.registerCommand(
                new KeyBinding(KeyModifier.META, KeyCode.SPACE, EditorCommand.TRIGGER_COMPLETION),
                (binding, editor) -> editor.triggerCompletion());
    }

    public static EditorKeyMap defaultKeyMap() {
        return vscode();
    }

    public static EditorKeyMap vscode() {
        EditorKeyMap keyMap = new EditorKeyMap();
        addCommonBindings(keyMap);

        bind(keyMap, KeyModifier.CTRL | KeyModifier.SHIFT, KeyCode.Z, EditorCommand.REDO);
        bind(keyMap, KeyModifier.META | KeyModifier.SHIFT, KeyCode.Z, EditorCommand.REDO);
        bind(keyMap, KeyModifier.CTRL, KeyCode.Y, EditorCommand.REDO);
        bind(keyMap, KeyModifier.META, KeyCode.Y, EditorCommand.REDO);

        bind(keyMap, KeyModifier.CTRL, KeyCode.ENTER, EditorCommand.INSERT_LINE_BELOW);
        bind(keyMap, KeyModifier.META, KeyCode.ENTER, EditorCommand.INSERT_LINE_BELOW);
        bind(keyMap, KeyModifier.CTRL | KeyModifier.SHIFT, KeyCode.ENTER, EditorCommand.INSERT_LINE_ABOVE);
        bind(keyMap, KeyModifier.META | KeyModifier.SHIFT, KeyCode.ENTER, EditorCommand.INSERT_LINE_ABOVE);

        bind(keyMap, KeyModifier.ALT, KeyCode.UP, EditorCommand.MOVE_LINE_UP);
        bind(keyMap, KeyModifier.ALT, KeyCode.DOWN, EditorCommand.MOVE_LINE_DOWN);
        bind(keyMap, KeyModifier.ALT | KeyModifier.SHIFT, KeyCode.UP, EditorCommand.COPY_LINE_UP);
        bind(keyMap, KeyModifier.ALT | KeyModifier.SHIFT, KeyCode.DOWN, EditorCommand.COPY_LINE_DOWN);

        bind(keyMap, KeyModifier.CTRL | KeyModifier.SHIFT, KeyCode.K, EditorCommand.DELETE_LINE);
        bind(keyMap, KeyModifier.META | KeyModifier.SHIFT, KeyCode.K, EditorCommand.DELETE_LINE);
        return keyMap;
    }

    public static EditorKeyMap jetbrains() {
        EditorKeyMap keyMap = new EditorKeyMap();
        addCommonBindings(keyMap);

        bind(keyMap, KeyModifier.CTRL | KeyModifier.SHIFT, KeyCode.Z, EditorCommand.REDO);
        bind(keyMap, KeyModifier.META | KeyModifier.SHIFT, KeyCode.Z, EditorCommand.REDO);

        bind(keyMap, KeyModifier.CTRL, KeyCode.Y, EditorCommand.DELETE_LINE);
        bind(keyMap, KeyModifier.META, KeyCode.Y, EditorCommand.DELETE_LINE);

        bind(keyMap, KeyModifier.CTRL, KeyCode.D, EditorCommand.COPY_LINE_DOWN);
        bind(keyMap, KeyModifier.META, KeyCode.D, EditorCommand.COPY_LINE_DOWN);

        bind(keyMap, KeyModifier.SHIFT, KeyCode.ENTER, EditorCommand.INSERT_LINE_BELOW);
        bind(keyMap, KeyModifier.CTRL | KeyModifier.ALT, KeyCode.ENTER, EditorCommand.INSERT_LINE_ABOVE);
        bind(keyMap, KeyModifier.META | KeyModifier.ALT, KeyCode.ENTER, EditorCommand.INSERT_LINE_ABOVE);

        bind(keyMap, KeyModifier.ALT | KeyModifier.SHIFT, KeyCode.UP, EditorCommand.MOVE_LINE_UP);
        bind(keyMap, KeyModifier.ALT | KeyModifier.SHIFT, KeyCode.DOWN, EditorCommand.MOVE_LINE_DOWN);
        return keyMap;
    }

    public static EditorKeyMap sublime() {
        EditorKeyMap keyMap = new EditorKeyMap();
        addCommonBindings(keyMap);

        bind(keyMap, KeyModifier.CTRL | KeyModifier.SHIFT, KeyCode.Z, EditorCommand.REDO);
        bind(keyMap, KeyModifier.META | KeyModifier.SHIFT, KeyCode.Z, EditorCommand.REDO);
        bind(keyMap, KeyModifier.CTRL, KeyCode.Y, EditorCommand.REDO);
        bind(keyMap, KeyModifier.META, KeyCode.Y, EditorCommand.REDO);

        bind(keyMap, KeyModifier.CTRL, KeyCode.ENTER, EditorCommand.INSERT_LINE_BELOW);
        bind(keyMap, KeyModifier.META, KeyCode.ENTER, EditorCommand.INSERT_LINE_BELOW);
        bind(keyMap, KeyModifier.CTRL | KeyModifier.SHIFT, KeyCode.ENTER, EditorCommand.INSERT_LINE_ABOVE);
        bind(keyMap, KeyModifier.META | KeyModifier.SHIFT, KeyCode.ENTER, EditorCommand.INSERT_LINE_ABOVE);

        bind(keyMap, KeyModifier.CTRL | KeyModifier.SHIFT, KeyCode.UP, EditorCommand.MOVE_LINE_UP);
        bind(keyMap, KeyModifier.CTRL | KeyModifier.SHIFT, KeyCode.DOWN, EditorCommand.MOVE_LINE_DOWN);

        bind(keyMap, KeyModifier.CTRL | KeyModifier.SHIFT, KeyCode.K, EditorCommand.DELETE_LINE);
        bind(keyMap, KeyModifier.META | KeyModifier.SHIFT, KeyCode.K, EditorCommand.DELETE_LINE);
        return keyMap;
    }
}
