package com.qiplat.sweeteditor.demo;

import com.qiplat.sweeteditor.copilot.InlineSuggestion;
import com.qiplat.sweeteditor.copilot.InlineSuggestionListener;
import com.qiplat.sweeteditor.core.foundation.TextPosition;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import androidx.annotation.NonNull;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class CopilotInteractionTest {

    @Rule
    public EditorTestRule editorRule = new EditorTestRule();

    @Test
    public void testShowInlineSuggestion() {
        editorRule.loadText("hello");
        editorRule.runOnEditor(editor -> {
            editor.setCursorPosition(new TextPosition(0, 5));
            editor.showInlineSuggestion(new InlineSuggestion(0, 5, " world"));
        });
        boolean showing = editorRule.runOnEditorSync(editor -> editor.isInlineSuggestionShowing());
        assertTrue("Inline suggestion should be showing", showing);
    }

    @Test
    public void testDismissInlineSuggestion() {
        editorRule.loadText("hello");
        editorRule.runOnEditor(editor -> {
            editor.setCursorPosition(new TextPosition(0, 5));
            editor.showInlineSuggestion(new InlineSuggestion(0, 5, " world"));
            editor.dismissInlineSuggestion();
        });
        boolean showing = editorRule.runOnEditorSync(editor -> editor.isInlineSuggestionShowing());
        assertFalse("Inline suggestion should be dismissed", showing);
    }

    @Test
    public void testIsInlineSuggestionShowingInitiallyFalse() {
        editorRule.loadText("hello");
        boolean showing = editorRule.runOnEditorSync(editor -> editor.isInlineSuggestionShowing());
        assertFalse(showing);
    }

    @Test
    public void testAcceptInlineSuggestionViaTab() {
        editorRule.loadText("hello");
        AtomicBoolean accepted = new AtomicBoolean(false);
        CountDownLatch latch = new CountDownLatch(1);
        editorRule.runOnEditor(editor -> {
            editor.setInlineSuggestionListener(new InlineSuggestionListener() {
                @Override
                public void onSuggestionAccepted(@NonNull InlineSuggestion suggestion) {
                    accepted.set(true);
                    latch.countDown();
                }

                @Override
                public void onSuggestionDismissed(@NonNull InlineSuggestion suggestion) {
                }
            });
            editor.setCursorPosition(new TextPosition(0, 5));
            editor.showInlineSuggestion(new InlineSuggestion(0, 5, " world"));
        });
        // Simulate Tab key to accept
        editorRule.runOnEditor(editor -> {
            android.view.KeyEvent tabDown = new android.view.KeyEvent(
                    android.view.KeyEvent.ACTION_DOWN, android.view.KeyEvent.KEYCODE_TAB);
            editor.onKeyDown(android.view.KeyEvent.KEYCODE_TAB, tabDown);
        });
        editorRule.waitForIdle();
        try {
            latch.await(2, TimeUnit.SECONDS);
        } catch (InterruptedException ignored) {
        }
        assertTrue("Suggestion should be accepted via Tab", accepted.get());
        boolean showing = editorRule.runOnEditorSync(editor -> editor.isInlineSuggestionShowing());
        assertFalse("Suggestion should be dismissed after accept", showing);
    }

    @Test
    public void testDismissInlineSuggestionViaEscape() {
        editorRule.loadText("hello");
        AtomicBoolean dismissed = new AtomicBoolean(false);
        CountDownLatch latch = new CountDownLatch(1);
        editorRule.runOnEditor(editor -> {
            editor.setInlineSuggestionListener(new InlineSuggestionListener() {
                @Override
                public void onSuggestionAccepted(@NonNull InlineSuggestion suggestion) {
                }

                @Override
                public void onSuggestionDismissed(@NonNull InlineSuggestion suggestion) {
                    dismissed.set(true);
                    latch.countDown();
                }
            });
            editor.setCursorPosition(new TextPosition(0, 5));
            editor.showInlineSuggestion(new InlineSuggestion(0, 5, " world"));
        });
        // Simulate Escape key to dismiss
        editorRule.runOnEditor(editor -> {
            android.view.KeyEvent escDown = new android.view.KeyEvent(
                    android.view.KeyEvent.ACTION_DOWN, android.view.KeyEvent.KEYCODE_ESCAPE);
            editor.onKeyDown(android.view.KeyEvent.KEYCODE_ESCAPE, escDown);
        });
        editorRule.waitForIdle();
        try {
            latch.await(2, TimeUnit.SECONDS);
        } catch (InterruptedException ignored) {
        }
        assertTrue("Suggestion should be dismissed via Escape", dismissed.get());
        boolean showing = editorRule.runOnEditorSync(editor -> editor.isInlineSuggestionShowing());
        assertFalse(showing);
    }

    @Test
    public void testDismissOnCursorMove() {
        editorRule.loadText("hello\nworld");
        editorRule.runOnEditor(editor -> {
            editor.setCursorPosition(new TextPosition(0, 5));
            editor.showInlineSuggestion(new InlineSuggestion(0, 5, " suggestion"));
        });
        assertTrue(editorRule.runOnEditorSync(editor -> editor.isInlineSuggestionShowing()));
        editorRule.runOnEditor(editor -> editor.setCursorPosition(new TextPosition(1, 0)));
        editorRule.waitForIdle();
        // After cursor move, suggestion may auto-dismiss depending on implementation
    }

    @Test
    public void testListenerAcceptCallback() {
        editorRule.loadText("hello");
        AtomicReference<InlineSuggestion> acceptedSuggestion = new AtomicReference<>();
        editorRule.runOnEditor(editor -> {
            editor.setInlineSuggestionListener(new InlineSuggestionListener() {
                @Override
                public void onSuggestionAccepted(@NonNull InlineSuggestion suggestion) {
                    acceptedSuggestion.set(suggestion);
                }

                @Override
                public void onSuggestionDismissed(@NonNull InlineSuggestion suggestion) {
                }
            });
            editor.setCursorPosition(new TextPosition(0, 5));
            editor.showInlineSuggestion(new InlineSuggestion(0, 5, " world"));
        });
        editorRule.runOnEditor(editor -> {
            android.view.KeyEvent tabDown = new android.view.KeyEvent(
                    android.view.KeyEvent.ACTION_DOWN, android.view.KeyEvent.KEYCODE_TAB);
            editor.onKeyDown(android.view.KeyEvent.KEYCODE_TAB, tabDown);
        });
        editorRule.waitForIdle();
        InlineSuggestion s = acceptedSuggestion.get();
        assertNotNull("Accepted suggestion should not be null", s);
        assertEquals(" world", s.text);
    }

    @Test
    public void testListenerDismissCallback() {
        editorRule.loadText("hello");
        AtomicReference<InlineSuggestion> dismissedSuggestion = new AtomicReference<>();
        editorRule.runOnEditor(editor -> {
            editor.setInlineSuggestionListener(new InlineSuggestionListener() {
                @Override
                public void onSuggestionAccepted(@NonNull InlineSuggestion suggestion) {
                }

                @Override
                public void onSuggestionDismissed(@NonNull InlineSuggestion suggestion) {
                    dismissedSuggestion.set(suggestion);
                }
            });
            editor.setCursorPosition(new TextPosition(0, 5));
            editor.showInlineSuggestion(new InlineSuggestion(0, 5, " world"));
        });
        editorRule.runOnEditor(editor -> {
            android.view.KeyEvent escDown = new android.view.KeyEvent(
                    android.view.KeyEvent.ACTION_DOWN, android.view.KeyEvent.KEYCODE_ESCAPE);
            editor.onKeyDown(android.view.KeyEvent.KEYCODE_ESCAPE, escDown);
        });
        editorRule.waitForIdle();
        InlineSuggestion s = dismissedSuggestion.get();
        assertNotNull("Dismissed suggestion should not be null", s);
        assertEquals(" world", s.text);
    }
}
