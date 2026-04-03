package com.qiplat.sweeteditor.demo;

import com.qiplat.sweeteditor.completion.CompletionContext;
import com.qiplat.sweeteditor.completion.CompletionItem;
import com.qiplat.sweeteditor.completion.CompletionProvider;
import com.qiplat.sweeteditor.completion.CompletionReceiver;
import com.qiplat.sweeteditor.completion.CompletionResult;
import com.qiplat.sweeteditor.core.foundation.TextPosition;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.Arrays;
import java.util.Collections;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

import androidx.annotation.NonNull;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class CompletionInteractionTest {

    @Rule
    public EditorTestRule editorRule = new EditorTestRule();

    private CompletionItem makeItem(String label) {
        CompletionItem item = new CompletionItem();
        item.label = label;
        item.kind = CompletionItem.KIND_KEYWORD;
        return item;
    }

    @Test
    public void testAddCompletionProvider() {
        editorRule.loadText("hello");
        editorRule.runOnEditor(editor -> editor.addCompletionProvider(new CompletionProvider() {
            @Override
            public boolean isTriggerCharacter(@NonNull String ch) {
                return ".".equals(ch);
            }

            @Override
            public void provideCompletions(@NonNull CompletionContext context, @NonNull CompletionReceiver receiver) {
                receiver.accept(CompletionResult.EMPTY);
            }
        }));
        // Should not crash
    }

    @Test
    public void testTriggerCompletion() {
        editorRule.loadText("hello");
        AtomicBoolean providerCalled = new AtomicBoolean(false);
        CountDownLatch latch = new CountDownLatch(1);
        editorRule.runOnEditor(editor -> {
            editor.addCompletionProvider(new CompletionProvider() {
                @Override
                public boolean isTriggerCharacter(@NonNull String ch) {
                    return false;
                }

                @Override
                public void provideCompletions(@NonNull CompletionContext context, @NonNull CompletionReceiver receiver) {
                    providerCalled.set(true);
                    latch.countDown();
                    receiver.accept(new CompletionResult(
                            Collections.singletonList(makeItem("test")), false));
                }
            });
            editor.setCursorPosition(new TextPosition(0, 5));
            editor.triggerCompletion();
        });
        try {
            latch.await(3, TimeUnit.SECONDS);
        } catch (InterruptedException ignored) {
        }
        assertTrue("Provider should be called on triggerCompletion", providerCalled.get());
    }

    @Test
    public void testShowCompletionItems() {
        editorRule.loadText("hello");
        editorRule.runOnEditor(editor -> {
            editor.setCursorPosition(new TextPosition(0, 5));
            editor.showCompletionItems(Arrays.asList(
                    makeItem("item1"),
                    makeItem("item2"),
                    makeItem("item3")));
        });
        editorRule.waitForIdle();
        // Completion popup should be shown (no crash)
    }

    @Test
    public void testDismissCompletion() {
        editorRule.loadText("hello");
        editorRule.runOnEditor(editor -> {
            editor.setCursorPosition(new TextPosition(0, 5));
            editor.showCompletionItems(Collections.singletonList(makeItem("test")));
        });
        editorRule.waitForIdle();
        editorRule.runOnEditor(editor -> editor.dismissCompletion());
        editorRule.waitForIdle();
        // Should not crash
    }

    @Test
    public void testCompletionOnTriggerCharacter() {
        editorRule.loadText("obj");
        AtomicBoolean triggered = new AtomicBoolean(false);
        CountDownLatch latch = new CountDownLatch(1);
        editorRule.runOnEditor(editor -> {
            editor.addCompletionProvider(new CompletionProvider() {
                @Override
                public boolean isTriggerCharacter(@NonNull String ch) {
                    return ".".equals(ch);
                }

                @Override
                public void provideCompletions(@NonNull CompletionContext context, @NonNull CompletionReceiver receiver) {
                    if (context.triggerKind == CompletionContext.TriggerKind.CHARACTER) {
                        triggered.set(true);
                        latch.countDown();
                    }
                    receiver.accept(CompletionResult.EMPTY);
                }
            });
            editor.setCursorPosition(new TextPosition(0, 3));
        });
        editorRule.runOnEditor(editor -> editor.insertText("."));
        try {
            latch.await(3, TimeUnit.SECONDS);
        } catch (InterruptedException ignored) {
        }
        assertTrue("Provider should be triggered by '.' character", triggered.get());
    }

    @Test
    public void testRemoveCompletionProvider() {
        editorRule.loadText("hello");
        CompletionProvider provider = new CompletionProvider() {
            @Override
            public boolean isTriggerCharacter(@NonNull String ch) {
                return false;
            }

            @Override
            public void provideCompletions(@NonNull CompletionContext context, @NonNull CompletionReceiver receiver) {
                receiver.accept(CompletionResult.EMPTY);
            }
        };
        editorRule.runOnEditor(editor -> {
            editor.addCompletionProvider(provider);
            editor.removeCompletionProvider(provider);
        });
        // Should not crash
    }

    @Test
    public void testMultipleCompletionItems() {
        editorRule.loadText("hello");
        editorRule.runOnEditor(editor -> {
            editor.setCursorPosition(new TextPosition(0, 5));
            CompletionItem item1 = makeItem("function");
            item1.kind = CompletionItem.KIND_FUNCTION;
            CompletionItem item2 = makeItem("variable");
            item2.kind = CompletionItem.KIND_VARIABLE;
            CompletionItem item3 = makeItem("class");
            item3.kind = CompletionItem.KIND_CLASS;
            editor.showCompletionItems(Arrays.asList(item1, item2, item3));
        });
        editorRule.waitForIdle();
        editorRule.runOnEditor(editor -> editor.dismissCompletion());
        // Should not crash
    }
}
