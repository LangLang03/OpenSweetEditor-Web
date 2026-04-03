package com.qiplat.sweeteditor.demo;

import android.app.Instrumentation;

import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.rules.ActivityScenarioRule;
import androidx.test.platform.app.InstrumentationRegistry;

import com.qiplat.sweeteditor.SweetEditor;
import com.qiplat.sweeteditor.core.Document;

import org.junit.rules.ExternalResource;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Reusable test rule that launches EditorTestActivity and provides helper methods
 * for running operations on the editor from the UI thread.
 */
public class EditorTestRule extends ExternalResource {

    private ActivityScenario<EditorTestActivity> mScenario;
    private final AtomicReference<SweetEditor> mEditorRef = new AtomicReference<>();

    @Override
    protected void before() {
        mScenario = ActivityScenario.launch(EditorTestActivity.class);
        mScenario.onActivity(activity -> mEditorRef.set(activity.getEditor()));
        waitForIdle();
    }

    @Override
    protected void after() {
        if (mScenario != null) {
            mScenario.close();
        }
    }

    public SweetEditor getEditor() {
        return mEditorRef.get();
    }

    public ActivityScenario<EditorTestActivity> getScenario() {
        return mScenario;
    }

    /**
     * Run an action on the UI thread and wait for completion.
     */
    public void runOnEditor(EditorAction action) {
        mScenario.onActivity(activity -> action.run(activity.getEditor()));
        waitForIdle();
    }

    /**
     * Run an action on the UI thread and return a result.
     */
    public <T> T runOnEditorSync(EditorFunction<T> func) {
        AtomicReference<T> result = new AtomicReference<>();
        mScenario.onActivity(activity -> result.set(func.apply(activity.getEditor())));
        waitForIdle();
        return result.get();
    }

    /**
     * Load a document with the given text content.
     */
    public void loadText(String text) {
        runOnEditor(editor -> editor.loadDocument(new Document(text)));
    }

    public void waitForIdle() {
        InstrumentationRegistry.getInstrumentation().waitForIdleSync();
    }

    @FunctionalInterface
    public interface EditorAction {
        void run(SweetEditor editor);
    }

    @FunctionalInterface
    public interface EditorFunction<T> {
        T apply(SweetEditor editor);
    }
}
