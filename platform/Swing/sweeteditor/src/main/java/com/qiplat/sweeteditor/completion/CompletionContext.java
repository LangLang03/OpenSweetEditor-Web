package com.qiplat.sweeteditor.completion;

import com.qiplat.sweeteditor.EditorMetadata;
import com.qiplat.sweeteditor.LanguageConfiguration;
import com.qiplat.sweeteditor.core.foundation.TextPosition;
import com.qiplat.sweeteditor.core.foundation.TextRange;

/**
 * Completion request context: trigger type + cursor position + current line text + wordRange.
 */
public class CompletionContext {

    public enum TriggerKind {
        INVOKED,
        CHARACTER,
        RETRIGGER
    }

    public final TriggerKind triggerKind;
    public final String triggerCharacter;
    public final TextPosition cursorPosition;
    public final String lineText;
    public final TextRange wordRange;
    /** Current language configuration (from LanguageConfiguration) */
    public final LanguageConfiguration languageConfiguration;
    /** Current editor metadata (from SweetEditor) */
    public final EditorMetadata editorMetadata;

    public CompletionContext(TriggerKind triggerKind, String triggerCharacter,
                             TextPosition cursorPosition, String lineText, TextRange wordRange,
                             LanguageConfiguration languageConfiguration,
                             EditorMetadata editorMetadata) {
        this.triggerKind = triggerKind;
        this.triggerCharacter = triggerCharacter;
        this.cursorPosition = cursorPosition;
        this.lineText = lineText;
        this.wordRange = wordRange;
        this.languageConfiguration = languageConfiguration;
        this.editorMetadata = editorMetadata;
    }
}
