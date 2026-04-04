package com.qiplat.sweeteditor.core.adornment;

public final class Diagnostic {
    public final int column;
    public final int length;
    public final int severity;
    public final int color;

    public Diagnostic(int column, int length, int severity, int color) {
        this.column = column;
        this.length = length;
        this.severity = severity;
        this.color = color;
    }
}
