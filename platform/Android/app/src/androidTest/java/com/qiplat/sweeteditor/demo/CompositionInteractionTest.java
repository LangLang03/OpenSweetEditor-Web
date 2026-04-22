package com.qiplat.sweeteditor.demo;

import android.view.inputmethod.BaseInputConnection;
import android.view.inputmethod.InputConnection;

import com.qiplat.sweeteditor.core.foundation.TextPosition;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import androidx.test.ext.junit.runners.AndroidJUnit4;

import static org.junit.Assert.*;

/**
 * Tests IME composition (composing text) flow through InputConnection.
 * Since SweetEditor's composition methods are package-private, we drive
 * the flow through the standard Android InputConnection API.
 */
@RunWith(AndroidJUnit4.class)
public class CompositionInteractionTest {

    @Rule
    public EditorTestRule editorRule = new EditorTestRule();

    private InputConnection getInputConnection() {
        return editorRule.runOnEditorSync(editor -> {
            android.view.inputmethod.EditorInfo info = new android.view.inputmethod.EditorInfo();
            return editor.onCreateInputConnection(info);
        });
    }

    @Test
    public void testCompositionFlowCommit() {
        editorRule.loadText("");
        editorRule.runOnEditor(editor -> editor.getSettings().setCompositionEnabled(true));
        InputConnection ic = getInputConnection();
        assertNotNull("InputConnection should not be null", ic);
        editorRule.runOnEditor(editor -> {
            android.view.inputmethod.EditorInfo info = new android.view.inputmethod.EditorInfo();
            InputConnection conn = editor.onCreateInputConnection(info);
            conn.setComposingText("pin", 1);
        });
        editorRule.waitForIdle();
        editorRule.runOnEditor(editor -> {
            android.view.inputmethod.EditorInfo info = new android.view.inputmethod.EditorInfo();
            InputConnection conn = editor.onCreateInputConnection(info);
            conn.finishComposingText();
        });
        editorRule.waitForIdle();
        String text = editorRule.runOnEditorSync(editor -> editor.getDocument().getText());
        assertFalse("Document should contain committed text", text.isEmpty());
    }

    @Test
    public void testCompositionCommitText() {
        editorRule.loadText("");
        editorRule.runOnEditor(editor -> {
            android.view.inputmethod.EditorInfo info = new android.view.inputmethod.EditorInfo();
            InputConnection conn = editor.onCreateInputConnection(info);
            conn.commitText("hello", 1);
        });
        editorRule.waitForIdle();
        String text = editorRule.runOnEditorSync(editor -> editor.getDocument().getText());
        assertEquals("hello", text);
    }

    @Test
    public void testCompositionMultipleCommits() {
        editorRule.loadText("");
        editorRule.runOnEditor(editor -> {
            android.view.inputmethod.EditorInfo info = new android.view.inputmethod.EditorInfo();
            InputConnection conn = editor.onCreateInputConnection(info);
            conn.commitText("hello", 1);
            conn.commitText(" ", 1);
            conn.commitText("world", 1);
        });
        editorRule.waitForIdle();
        String text = editorRule.runOnEditorSync(editor -> editor.getDocument().getText());
        assertEquals("hello world", text);
    }

    @Test
    public void testInputConnectionNotNull() {
        editorRule.loadText("hello");
        InputConnection ic = getInputConnection();
        assertNotNull(ic);
    }

    @Test
    public void testOnCheckIsTextEditor() {
        boolean isTextEditor = editorRule.runOnEditorSync(editor -> editor.onCheckIsTextEditor());
        assertTrue("SweetEditor should report as text editor", isTextEditor);
    }

    @Test
    public void testDeleteSurroundingText() {
        editorRule.loadText("hello world");
        editorRule.runOnEditor(editor -> {
            editor.setCursorPosition(new TextPosition(0, 5));
            android.view.inputmethod.EditorInfo info = new android.view.inputmethod.EditorInfo();
            InputConnection conn = editor.onCreateInputConnection(info);
            conn.deleteSurroundingText(5, 0);
        });
        editorRule.waitForIdle();
        String text = editorRule.runOnEditorSync(editor -> editor.getDocument().getText());
        assertEquals(" world", text);
    }

    @Test
    public void testComposingTextUpdate() {
        editorRule.loadText("");
        editorRule.runOnEditor(editor -> editor.getSettings().setCompositionEnabled(true));
        editorRule.runOnEditor(editor -> {
            android.view.inputmethod.EditorInfo info = new android.view.inputmethod.EditorInfo();
            InputConnection conn = editor.onCreateInputConnection(info);
            conn.setComposingText("p", 1);
            conn.setComposingText("pi", 1);
            conn.setComposingText("pin", 1);
            conn.commitText("pin", 1);
        });
        editorRule.waitForIdle();
        String text = editorRule.runOnEditorSync(editor -> editor.getDocument().getText());
        assertEquals("pin", text);
    }

    @Test
    public void testDisabledCompositionCandidateCommit() {
        editorRule.loadText("");
        editorRule.runOnEditor(editor -> editor.getSettings().setCompositionEnabled(false));
        editorRule.runOnEditor(editor -> {
            android.view.inputmethod.EditorInfo info = new android.view.inputmethod.EditorInfo();
            InputConnection conn = editor.onCreateInputConnection(info);
            conn.setComposingText("ni", 1);
            conn.commitText("你", 1);
        });
        editorRule.waitForIdle();
        String text = editorRule.runOnEditorSync(editor -> editor.getDocument().getText());
        assertEquals("你", text);
    }

    @Test
    public void testDisabledCompositionCleanupDeleteDoesNotRemoveCommittedText() {
        editorRule.loadText("a");
        editorRule.runOnEditor(editor -> {
            editor.getSettings().setCompositionEnabled(false);
            editor.setCursorPosition(new TextPosition(0, 1));
            android.view.inputmethod.EditorInfo info = new android.view.inputmethod.EditorInfo();
            InputConnection conn = editor.onCreateInputConnection(info);
            conn.setComposingText("ni", 1);
            conn.commitText("你", 1);
            conn.deleteSurroundingText(2, 0);
        });
        editorRule.waitForIdle();
        String text = editorRule.runOnEditorSync(editor -> editor.getDocument().getText());
        assertEquals("a你", text);
    }
}
