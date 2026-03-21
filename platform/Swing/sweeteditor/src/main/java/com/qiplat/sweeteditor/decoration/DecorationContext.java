package com.qiplat.sweeteditor.decoration;

import com.qiplat.sweeteditor.EditorMetadata;
import com.qiplat.sweeteditor.LanguageConfiguration;
import com.qiplat.sweeteditor.core.foundation.TextChange;

import java.util.Collections;
import java.util.List;

public final class DecorationContext {
    public final int visibleStartLine;
    public final int visibleEndLine;
    public final int totalLineCount;
    /** All text changes accumulated during this refresh cycle (immutable view), empty list indicates non-text-change trigger */
    public final List<TextChange> textChanges;
    /** Current language configuration (from LanguageConfiguration) */
    public final LanguageConfiguration languageConfiguration;
    /** Current editor metadata (from SweetEditor) */
    public final EditorMetadata editorMetadata;

    public DecorationContext(int visibleStartLine, int visibleEndLine, int totalLineCount,
                             List<TextChange> textChanges, LanguageConfiguration languageConfiguration,
                             EditorMetadata editorMetadata) {
        this.visibleStartLine = visibleStartLine;
        this.visibleEndLine = visibleEndLine;
        this.totalLineCount = totalLineCount;
        this.textChanges = Collections.unmodifiableList(textChanges);
        this.languageConfiguration = languageConfiguration;
        this.editorMetadata = editorMetadata;
    }
}
