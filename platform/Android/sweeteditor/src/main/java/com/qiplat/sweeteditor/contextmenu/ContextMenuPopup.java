package com.qiplat.sweeteditor.contextmenu;

import android.content.Context;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.RippleDrawable;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.AccelerateInterpolator;
import android.view.animation.DecelerateInterpolator;
import android.view.animation.Interpolator;
import android.widget.LinearLayout;
import android.widget.PopupWindow;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.util.List;

/**
 * Floating popup used to render context menu sections.
 */
public final class ContextMenuPopup {

    public interface OnMenuItemClickListener {
        void onMenuItemClick(@NonNull ContextMenuItem item);
    }

    private static final int CORNER_RADIUS_DP = 8;
    private static final int CONTAINER_ELEVATION_DP = 6;
    private static final int MIN_WIDTH_DP = 120;
    private static final int ROW_HEIGHT_DP = 36;
    private static final int ROW_HORIZONTAL_PADDING_DP = 10;
    private static final int ROW_GAP_DP = 8;
    private static final int SECTION_DIVIDER_HEIGHT_DP = 1;
    private static final int SECTION_DIVIDER_MARGIN_H_DP = 10;
    private static final int SECTION_DIVIDER_MARGIN_V_DP = 4;
    private static final int SHOW_DURATION_MS = 160;
    private static final int DISMISS_DURATION_MS = 110;
    private static final float SHOW_START_SCALE = 0.96f;
    private static final float DISMISS_END_SCALE = 0.985f;
    private static final int SHOW_PIVOT_X_DP = 24;
    private static final int SHOW_PIVOT_Y_DP = 12;

    private final Context context;
    private final PopupWindow popupWindow;
    private final Interpolator showInterpolator = new DecelerateInterpolator(1.6f);
    private final Interpolator dismissInterpolator = new AccelerateInterpolator(1.2f);
    private View contentView;

    private int bgColor;
    private int textColor;
    private int dividerColor;
    private int rippleColor;

    @Nullable private OnMenuItemClickListener listener;
    @Nullable private List<ContextMenuSection> currentSections;

    public ContextMenuPopup(@NonNull Context context, int bgColor, int textColor, int dividerColor) {
        this.context = context;
        this.bgColor = bgColor;
        this.textColor = textColor;
        this.dividerColor = resolveDividerColor(bgColor, dividerColor);
        this.rippleColor = deriveOverlayColor(bgColor);

        contentView = new View(context);
        popupWindow = new PopupWindow(contentView,
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        popupWindow.setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
        popupWindow.setClippingEnabled(true);
        popupWindow.setOutsideTouchable(false);
        popupWindow.setFocusable(false);
    }

    public void setOnMenuItemClickListener(@Nullable OnMenuItemClickListener listener) {
        this.listener = listener;
    }

    public void updateTheme(int bgColor, int textColor, int dividerColor) {
        this.bgColor = bgColor;
        this.textColor = textColor;
        this.dividerColor = resolveDividerColor(bgColor, dividerColor);
        this.rippleColor = deriveOverlayColor(bgColor);
        if (currentSections != null) {
            rebuildContent(currentSections);
        }
    }

    public void showAt(@NonNull View anchor, int x, int y, @NonNull List<ContextMenuSection> sections) {
        if (popupWindow.isShowing()) {
            popupWindow.dismiss();
        }
        currentSections = sections;
        rebuildContent(sections);
        contentView.measure(View.MeasureSpec.UNSPECIFIED, View.MeasureSpec.UNSPECIFIED);
        int popupWidth = contentView.getMeasuredWidth();
        int popupHeight = contentView.getMeasuredHeight();

        int clampedX = Math.max(0, Math.min(x, Math.max(0, anchor.getWidth() - popupWidth)));
        int desiredY = y;
        boolean showAboveAnchor = false;
        if (desiredY + popupHeight > anchor.getHeight()) {
            desiredY = y - popupHeight;
            showAboveAnchor = true;
        }
        int clampedY = Math.max(0, Math.min(desiredY, Math.max(0, anchor.getHeight() - popupHeight)));

        popupWindow.showAtLocation(anchor, Gravity.NO_GRAVITY, clampedX, clampedY);
        prepareForShow(showAboveAnchor);
        animateIn();
    }

    public void dismiss() {
        if (popupWindow.isShowing()) {
            animateOut(() -> {
                if (popupWindow.isShowing()) {
                    popupWindow.dismiss();
                }
            });
        }
    }

    public void dismissImmediate() {
        if (popupWindow.isShowing()) {
            popupWindow.dismiss();
        }
    }

    public boolean isShowing() {
        return popupWindow.isShowing();
    }

    private void rebuildContent(@NonNull List<ContextMenuSection> sections) {
        View newContent = buildContentView(sections);
        popupWindow.setContentView(newContent);
        contentView = newContent;
    }

    private View buildContentView(@NonNull List<ContextMenuSection> sections) {
        LinearLayout container = new LinearLayout(context);
        container.setOrientation(LinearLayout.VERTICAL);
        if (MIN_WIDTH_DP > 0) {
            container.setMinimumWidth(dpToPx(MIN_WIDTH_DP));
        }

        GradientDrawable bg = new GradientDrawable();
        bg.setColor(bgColor);
        bg.setCornerRadius(dpToPx(CORNER_RADIUS_DP));
        container.setBackground(bg);
        container.setElevation(dpToPx(CONTAINER_ELEVATION_DP));

        for (int sectionIndex = 0; sectionIndex < sections.size(); sectionIndex++) {
            ContextMenuSection section = sections.get(sectionIndex);
            for (ContextMenuItem item : section.items) {
                if (item != null) {
                    View row = createRow(item);
                    row.setLayoutParams(new LinearLayout.LayoutParams(
                            ViewGroup.LayoutParams.WRAP_CONTENT,
                            ViewGroup.LayoutParams.WRAP_CONTENT));
                    container.addView(row);
                }
            }
            if (sectionIndex < sections.size() - 1) {
                container.addView(createSectionDivider());
            }
        }
        return container;
    }

    private View createRow(@NonNull ContextMenuItem item) {
        LinearLayout row = new LinearLayout(context);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setMinimumHeight(dpToPx(ROW_HEIGHT_DP));
        row.setPadding(dpToPx(ROW_HORIZONTAL_PADDING_DP), 0, dpToPx(ROW_HORIZONTAL_PADDING_DP), 0);
        row.setBackground(createRowBackground());

        TextView labelView = new TextView(context);
        labelView.setText(item.label);
        labelView.setTextSize(12);
        labelView.setSingleLine(true);
        LinearLayout.LayoutParams labelLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        labelView.setLayoutParams(labelLp);

        TextView secondaryView = new TextView(context);
        secondaryView.setText(item.secondaryLabel != null ? item.secondaryLabel : "");
        secondaryView.setTextSize(11);
        secondaryView.setSingleLine(true);
        LinearLayout.LayoutParams secondaryLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        secondaryLp.leftMargin = dpToPx(ROW_GAP_DP);
        secondaryView.setLayoutParams(secondaryLp);

        if (item.enabled) {
            labelView.setTextColor(textColor);
            secondaryView.setTextColor(deriveSecondaryTextColor(textColor));
            row.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onMenuItemClick(item);
                }
            });
        } else {
            int disabledTextColor = Color.argb(96,
                    Color.red(textColor), Color.green(textColor), Color.blue(textColor));
            labelView.setTextColor(disabledTextColor);
            secondaryView.setTextColor(Color.argb(72,
                    Color.red(textColor), Color.green(textColor), Color.blue(textColor)));
            row.setClickable(false);
        }

        row.addView(labelView);
        if (item.secondaryLabel != null && !item.secondaryLabel.isEmpty()) {
            row.addView(secondaryView);
        }
        return row;
    }

    private View createSectionDivider() {
        View divider = new View(context);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dpToPx(SECTION_DIVIDER_HEIGHT_DP));
        int margin = dpToPx(SECTION_DIVIDER_MARGIN_V_DP);
        lp.topMargin = margin;
        lp.bottomMargin = margin;
        lp.leftMargin = dpToPx(SECTION_DIVIDER_MARGIN_H_DP);
        lp.rightMargin = dpToPx(SECTION_DIVIDER_MARGIN_H_DP);
        divider.setLayoutParams(lp);
        divider.setBackgroundColor(dividerColor);
        return divider;
    }

    private RippleDrawable createRowBackground() {
        GradientDrawable mask = new GradientDrawable();
        mask.setColor(Color.WHITE);
        mask.setCornerRadius(dpToPx(4));
        return new RippleDrawable(ColorStateList.valueOf(rippleColor), null, mask);
    }

    private void prepareForShow(boolean showAboveAnchor) {
        contentView.animate().cancel();
        contentView.clearAnimation();
        float pivotX = Math.min(dpToPx(SHOW_PIVOT_X_DP), contentView.getMeasuredWidth());
        float pivotY = showAboveAnchor
                ? Math.max(0, contentView.getMeasuredHeight() - dpToPx(SHOW_PIVOT_Y_DP))
                : Math.min(dpToPx(SHOW_PIVOT_Y_DP), contentView.getMeasuredHeight());
        contentView.setPivotX(pivotX);
        contentView.setPivotY(pivotY);
        contentView.setAlpha(0f);
        contentView.setScaleX(SHOW_START_SCALE);
        contentView.setScaleY(SHOW_START_SCALE);
    }

    private void animateIn() {
        contentView.animate()
                .alpha(1f)
                .scaleX(1f)
                .scaleY(1f)
                .setDuration(SHOW_DURATION_MS)
                .setInterpolator(showInterpolator)
                .start();
    }

    private void animateOut(@NonNull Runnable onEnd) {
        contentView.animate().cancel();
        contentView.animate()
                .alpha(0f)
                .scaleX(DISMISS_END_SCALE)
                .scaleY(DISMISS_END_SCALE)
                .setDuration(DISMISS_DURATION_MS)
                .setInterpolator(dismissInterpolator)
                .withEndAction(() -> {
                    contentView.setAlpha(1f);
                    contentView.setScaleX(1f);
                    contentView.setScaleY(1f);
                    contentView.post(onEnd);
                })
                .start();
    }

    private static int deriveOverlayColor(int base) {
        float lum = Color.luminance(base);
        return lum > 0.5f ? Color.argb(30, 0, 0, 0) : Color.argb(40, 255, 255, 255);
    }

    private static int resolveDividerColor(int bgColor, int dividerColor) {
        return dividerColor != 0 ? dividerColor : deriveOverlayColor(bgColor);
    }

    private static int deriveSecondaryTextColor(int textColor) {
        return Color.argb(170,
                Color.red(textColor), Color.green(textColor), Color.blue(textColor));
    }

    private int dpToPx(int dp) {
        return (int) (dp * context.getResources().getDisplayMetrics().density + 0.5f);
    }
}
