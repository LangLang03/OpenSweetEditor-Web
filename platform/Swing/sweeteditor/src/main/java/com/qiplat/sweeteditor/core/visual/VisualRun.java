package com.qiplat.sweeteditor.core.visual;

import com.google.gson.annotations.SerializedName;
import com.qiplat.sweeteditor.core.adornment.TextStyle;

public class VisualRun {
    @SerializedName("type") public VisualRunType type;
    @SerializedName("x") public float x;
    @SerializedName("y") public float y;
    @SerializedName("text") public String text;
    @SerializedName("style") public TextStyle style;
    @SerializedName("width") public float width;
    @SerializedName("padding") public float padding;
    @SerializedName("margin") public float margin;
    @SerializedName("icon_id") public int iconId;
    @SerializedName("color_value") public int colorValue;
    @SerializedName("active") public boolean active;
}
