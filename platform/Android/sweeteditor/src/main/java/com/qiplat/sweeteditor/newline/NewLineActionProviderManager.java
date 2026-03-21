package com.qiplat.sweeteditor.newline;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.qiplat.sweeteditor.SweetEditor;
import com.qiplat.sweeteditor.core.Document;
import com.qiplat.sweeteditor.core.foundation.TextPosition;

import java.util.ArrayList;
import java.util.List;

/**
 * Chain-based manager for newline providers, iterates until the first non-null provider takes effect.
 */
public class NewLineActionProviderManager {

    private final SweetEditor editor;
    private final List<NewLineActionProvider> providers = new ArrayList<>();

    public NewLineActionProviderManager(@NonNull SweetEditor editor) {
        this.editor = editor;
    }

    public void addProvider(@NonNull NewLineActionProvider provider) {
        providers.add(provider);
    }

    public void removeProvider(@NonNull NewLineActionProvider provider) {
        providers.remove(provider);
    }

    /**
     * Iterate all providers, return first non-null NewLineAction; return null if all return null.
     */
    @Nullable
    public NewLineAction provideNewLineAction() {
        TextPosition cursor = editor.getCursorPosition();
        if (cursor == null) return null;
        Document doc = editor.getDocument();
        String lineText = (doc != null) ? doc.getLineText(cursor.line) : "";
        if (lineText == null) lineText = "";
        NewLineContext context = new NewLineContext(
                cursor.line,
                cursor.column,
                lineText,
                editor.getLanguageConfiguration(),
                editor.getMetadata());
        for (NewLineActionProvider provider : providers) {
            NewLineAction action = provider.provideNewLineAction(context);
            if (action != null) {
                return action;
            }
        }
        return null;
    }
}
