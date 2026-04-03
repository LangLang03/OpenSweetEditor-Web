package com.qiplat.sweeteditor.demo;

import android.os.Bundle;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.qiplat.sweeteditor.SweetEditor;

/**
 * Lightweight Activity hosting a single full-screen SweetEditor for UI tests.
 */
public class EditorTestActivity extends AppCompatActivity {

    private SweetEditor mEditor;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        FrameLayout root = new FrameLayout(this);
        mEditor = new SweetEditor(this);
        root.addView(mEditor, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);
    }

    public SweetEditor getEditor() {
        return mEditor;
    }
}
