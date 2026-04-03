package com.qiplat.sweeteditor.demo;

import android.os.SystemClock;
import android.view.MotionEvent;

import com.qiplat.sweeteditor.core.foundation.TextPosition;
import com.qiplat.sweeteditor.core.visual.CursorRect;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import androidx.test.ext.junit.runners.AndroidJUnit4;

import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class CursorInteractionTest {

    @Rule
    public EditorTestRule editorRule = new EditorTestRule();

    @Test
    public void testSetCursorPosition() {
        editorRule.loadText("hello world\nsecond line\nthird line");
        editorRule.runOnEditor(editor -> editor.setCursorPosition(new TextPosition(1, 3)));
        TextPosition pos = editorRule.runOnEditorSync(editor -> editor.getCursorPosition());
        assertEquals(1, pos.line);
        assertEquals(3, pos.column);
    }

    @Test
    public void testSetCursorPositionAtOrigin() {
        editorRule.loadText("hello");
        editorRule.runOnEditor(editor -> editor.setCursorPosition(new TextPosition(0, 0)));
        TextPosition pos = editorRule.runOnEditorSync(editor -> editor.getCursorPosition());
        assertEquals(0, pos.line);
        assertEquals(0, pos.column);
    }

    @Test
    public void testSetCursorPositionAtEnd() {
        editorRule.loadText("hello");
        editorRule.runOnEditor(editor -> editor.setCursorPosition(new TextPosition(0, 5)));
        TextPosition pos = editorRule.runOnEditorSync(editor -> editor.getCursorPosition());
        assertEquals(0, pos.line);
        assertEquals(5, pos.column);
    }

    @Test
    public void testGotoPositionMovesCursorAndScrolls() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 200; i++) sb.append("line ").append(i).append("\n");
        editorRule.loadText(sb.toString());
        editorRule.runOnEditor(editor -> editor.gotoPosition(150, 0));
        TextPosition pos = editorRule.runOnEditorSync(editor -> editor.getCursorPosition());
        assertEquals(150, pos.line);
        int[] visible = editorRule.runOnEditorSync(editor -> editor.getVisibleLineRange());
        assertTrue("Line 150 should be visible", visible[0] <= 150 && visible[1] >= 150);
    }

    @Test
    public void testCursorRectValid() {
        editorRule.loadText("hello world");
        editorRule.runOnEditor(editor -> editor.setCursorPosition(new TextPosition(0, 0)));
        CursorRect rect = editorRule.runOnEditorSync(editor -> editor.getCursorRect());
        assertTrue("cursor x should be non-negative", rect.x >= 0);
        assertTrue("cursor y should be non-negative", rect.y >= 0);
        assertTrue("cursor height should be positive", rect.height > 0);
    }

    @Test
    public void testGetWordAtCursor() {
        editorRule.loadText("hello world");
        editorRule.runOnEditor(editor -> editor.setCursorPosition(new TextPosition(0, 2)));
        String word = editorRule.runOnEditorSync(editor -> editor.getWordAtCursor());
        assertEquals("hello", word);
    }

    @Test
    public void testGetWordAtCursorSecondWord() {
        editorRule.loadText("hello world");
        editorRule.runOnEditor(editor -> editor.setCursorPosition(new TextPosition(0, 8)));
        String word = editorRule.runOnEditorSync(editor -> editor.getWordAtCursor());
        assertEquals("world", word);
    }

    @Test
    public void testGetWordRangeAtCursor() {
        editorRule.loadText("hello world");
        editorRule.runOnEditor(editor -> editor.setCursorPosition(new TextPosition(0, 2)));
        com.qiplat.sweeteditor.core.foundation.TextRange range =
                editorRule.runOnEditorSync(editor -> editor.getWordRangeAtCursor());
        assertEquals(0, range.start.line);
        assertEquals(0, range.start.column);
        assertEquals(0, range.end.line);
        assertEquals(5, range.end.column);
    }

    @Test
    public void testTapPlacesCursor() {
        editorRule.loadText("hello world\nsecond line");
        editorRule.runOnEditor(editor -> {
            int cx = editor.getWidth() / 2;
            int cy = editor.getHeight() / 2;
            long downTime = SystemClock.uptimeMillis();
            editor.dispatchTouchEvent(MotionEvent.obtain(downTime, downTime, MotionEvent.ACTION_DOWN, cx, cy, 0));
            editor.dispatchTouchEvent(MotionEvent.obtain(downTime, downTime + 50, MotionEvent.ACTION_UP, cx, cy, 0));
        });
        editorRule.waitForIdle();
        TextPosition pos = editorRule.runOnEditorSync(editor -> editor.getCursorPosition());
        assertNotNull(pos);
    }

    @Test
    public void testGetPositionRect() {
        editorRule.loadText("hello world\nsecond line");
        CursorRect rect = editorRule.runOnEditorSync(editor -> editor.getPositionRect(0, 5));
        assertTrue("position rect x should be positive for column 5", rect.x > 0);
        assertTrue("position rect height should be positive", rect.height > 0);
    }
}
