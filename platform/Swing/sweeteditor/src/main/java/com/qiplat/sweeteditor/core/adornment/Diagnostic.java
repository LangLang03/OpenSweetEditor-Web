package com.qiplat.sweeteditor.core.adornment;

public final class Diagnostic {
    public final int column;
    public final int length;
    public final int severity;

    public Diagnostic(int column, int length, int severity) {
        this.column = column;
        this.length = length;
        this.severity = severity;
    }
}
