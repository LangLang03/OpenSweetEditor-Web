package com.qiplat.sweeteditor.core.visual;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class VisualLine {
    @SerializedName("logical_line") public int logicalLine;
    @SerializedName("wrap_index") public int wrapIndex;
    @SerializedName("line_number_position") public PointF lineNumberPosition;
    @SerializedName("runs") public List<VisualRun> runs;
    @SerializedName("kind") public VisualLineKind kind = VisualLineKind.CONTENT;
    @SerializedName("owns_gutter_semantics") public boolean ownsGutterSemantics;
    @SerializedName("fold_state") public FoldState foldState;
}
