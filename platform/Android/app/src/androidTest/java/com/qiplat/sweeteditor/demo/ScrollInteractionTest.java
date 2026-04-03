package com.qiplat.sweeteditor.demo;

import android.os.SystemClock;
import android.view.MotionEvent;

import com.qiplat.sweeteditor.core.Document;
import com.qiplat.sweeteditor.core.foundation.ScrollBehavior;
import com.qiplat.sweeteditor.core.visual.ScrollMetrics;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import androidx.test.ext.junit.runners.AndroidJUnit4;

import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class ScrollInteractionTest {

    @Rule
    public EditorTestRule editorRule = new EditorTestRule();

    private String generateLongContent(int lines) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < lines; i++) {
            sb.append("line ").append(i).append(": some content that fills the editor viewport\n");
        }
        return sb.toString();
    }

    @Test
    public void testSetScrollDirect() {
        editorRule.loadText(generateLongContent(200));
        editorRule.runOnEditor(editor -> editor.setScroll(0, 200));
        ScrollMetrics m = editorRule.runOnEditorSync(editor -> editor.getScrollMetrics());
        assertEquals(200f, m.scrollY, 1f);
    }

    @Test
    public void testScrollBoundsClampNegative() {
        editorRule.loadText(generateLongContent(200));
        editorRule.runOnEditor(editor -> editor.setScroll(0, -999));
        ScrollMetrics m = editorRule.runOnEditorSync(editor -> editor.getScrollMetrics());
        assertEquals(0f, m.scrollY, 1f);
    }

    @Test
    public void testScrollBoundsClampExceedMax() {
        editorRule.loadText(generateLongContent(200));
        editorRule.runOnEditor(editor -> editor.setScroll(0, 999999));
        ScrollMetrics m = editorRule.runOnEditorSync(editor -> editor.getScrollMetrics());
        assertTrue(m.scrollY <= m.maxScrollY + 1f);
    }

    @Test
    public void testScrollToLineCenter() {
        editorRule.loadText(generateLongContent(200));
        editorRule.runOnEditor(editor -> editor.scrollToLine(100, ScrollBehavior.CENTER));
        int[] visible = editorRule.runOnEditorSync(editor -> editor.getVisibleLineRange());
        assertTrue("Line 100 should be visible", visible[0] <= 100 && visible[1] >= 100);
    }

    @Test
    public void testScrollToLineTop() {
        editorRule.loadText(generateLongContent(200));
        editorRule.runOnEditor(editor -> editor.scrollToLine(50, ScrollBehavior.TOP));
        int[] visible = editorRule.runOnEditorSync(editor -> editor.getVisibleLineRange());
        assertTrue("Line 50 should be at or near top", visible[0] <= 50 && visible[1] >= 50);
    }

    @Test
    public void testSwipeUpScrollsDown() {
        editorRule.loadText(generateLongContent(200));
        editorRule.runOnEditor(editor -> editor.setScroll(0, 0));
        editorRule.runOnEditor(editor -> {
            int cx = editor.getWidth() / 2;
            int startY = editor.getHeight() * 3 / 4;
            int endY = editor.getHeight() / 4;
            long downTime = SystemClock.uptimeMillis();
            editor.dispatchTouchEvent(MotionEvent.obtain(downTime, downTime, MotionEvent.ACTION_DOWN, cx, startY, 0));
            for (int i = 1; i <= 5; i++) {
                long t = downTime + i * 10;
                float y = startY + (endY - startY) * i / 5f;
                editor.dispatchTouchEvent(MotionEvent.obtain(downTime, t, MotionEvent.ACTION_MOVE, cx, y, 0));
            }
            editor.dispatchTouchEvent(MotionEvent.obtain(downTime, downTime + 60, MotionEvent.ACTION_UP, cx, endY, 0));
        });
        editorRule.waitForIdle();
        ScrollMetrics m = editorRule.runOnEditorSync(editor -> editor.getScrollMetrics());
        assertTrue("scrollY should increase after swipe up", m.scrollY > 0);
    }

    @Test
    public void testSwipeDownScrollsUp() {
        editorRule.loadText(generateLongContent(200));
        editorRule.runOnEditor(editor -> editor.setScroll(0, 500));
        float before = editorRule.runOnEditorSync(editor -> editor.getScrollMetrics().scrollY);
        editorRule.runOnEditor(editor -> {
            int cx = editor.getWidth() / 2;
            int startY = editor.getHeight() / 4;
            int endY = editor.getHeight() * 3 / 4;
            long downTime = SystemClock.uptimeMillis();
            editor.dispatchTouchEvent(MotionEvent.obtain(downTime, downTime, MotionEvent.ACTION_DOWN, cx, startY, 0));
            for (int i = 1; i <= 5; i++) {
                long t = downTime + i * 10;
                float y = startY + (endY - startY) * i / 5f;
                editor.dispatchTouchEvent(MotionEvent.obtain(downTime, t, MotionEvent.ACTION_MOVE, cx, y, 0));
            }
            editor.dispatchTouchEvent(MotionEvent.obtain(downTime, downTime + 60, MotionEvent.ACTION_UP, cx, endY, 0));
        });
        editorRule.waitForIdle();
        ScrollMetrics m = editorRule.runOnEditorSync(editor -> editor.getScrollMetrics());
        assertTrue("scrollY should decrease after swipe down", m.scrollY < before);
    }

    @Test
    public void testHorizontalScroll() {
        String longLine = "a".repeat(500) + "\n";
        editorRule.loadText(longLine);
        editorRule.runOnEditor(editor -> editor.setScroll(100, 0));
        ScrollMetrics m = editorRule.runOnEditorSync(editor -> editor.getScrollMetrics());
        assertTrue("scrollX should be positive", m.scrollX > 0);
    }

    @Test
    public void testScrollMetricsContentDimensions() {
        editorRule.loadText(generateLongContent(200));
        ScrollMetrics m = editorRule.runOnEditorSync(editor -> editor.getScrollMetrics());
        assertTrue("contentHeight should be positive", m.contentHeight > 0);
        assertTrue("viewportHeight should be positive", m.viewportHeight > 0);
        assertTrue("contentHeight should exceed viewport for 200 lines", m.contentHeight > m.viewportHeight);
    }
}
