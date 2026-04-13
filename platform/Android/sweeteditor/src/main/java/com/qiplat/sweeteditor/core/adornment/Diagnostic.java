package com.qiplat.sweeteditor.core.adornment;

/**
 * Immutable value object representing diagnostic information (error, warning, hint, etc.) on a single line.
 * <p>
 * Each Diagnostic represents a diagnostic marker on a contiguous text segment,
 * including the starting column, character length, and severity.
 */
public final class Diagnostic {
    /** Starting column (0-based, UTF-16 offset) */
    public final int column;
    /** Character length */
    public final int length;
    /** Severity (0=error, 1=warning, 2=info, 3=hint) */
    public final int severity;
    /**
     * @param column   Starting column (0-based, UTF-16 offset)
     * @param length   Character length
     * @param severity Severity level
     */
    public Diagnostic(int column, int length, int severity) {
        this.column = column;
        this.length = length;
        this.severity = severity;
    }
}
