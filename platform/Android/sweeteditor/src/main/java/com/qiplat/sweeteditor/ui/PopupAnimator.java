package com.qiplat.sweeteditor.ui;

import android.view.View;
import android.view.animation.AccelerateInterpolator;
import android.view.animation.OvershootInterpolator;

import androidx.annotation.NonNull;

/**
 * Shared bubble-style animation for floating popup surfaces.
 */
public final class PopupAnimator {

    private static final int SHOW_DURATION_MS = 180;
    private static final int DISMISS_DURATION_MS = 110;
    private static final int SHOW_OFFSET_DP = 6;
    private static final int DISMISS_OFFSET_DP = 4;
    private static final float START_ALPHA = 0f;
    private static final float SHOW_START_SCALE = 0.88f;
    private static final float DISMISS_END_SCALE = 0.92f;
    private static final OvershootInterpolator SHOW_INTERPOLATOR = new OvershootInterpolator(0.7f);
    private static final AccelerateInterpolator DISMISS_INTERPOLATOR = new AccelerateInterpolator(1.25f);

    private PopupAnimator() {
    }

    public static void prepareForShow(@NonNull View content,
                                      @NonNull PopupPositioner.Placement placement) {
        content.animate().cancel();
        content.clearAnimation();
        applyPivot(content, placement);
        float offset = PopupPositioner.dpToPx(content.getContext(), SHOW_OFFSET_DP);
        content.setAlpha(START_ALPHA);
        content.setScaleX(SHOW_START_SCALE);
        content.setScaleY(SHOW_START_SCALE);
        content.setTranslationX(resolveOffsetX(placement.side, offset));
        content.setTranslationY(resolveOffsetY(placement.side, offset));
    }

    public static void animateShow(@NonNull View content,
                                   @NonNull PopupPositioner.Placement placement) {
        content.animate().cancel();
        applyPivot(content, placement);
        content.animate()
                .alpha(1f)
                .scaleX(1f)
                .scaleY(1f)
                .translationX(0f)
                .translationY(0f)
                .setDuration(SHOW_DURATION_MS)
                .setInterpolator(SHOW_INTERPOLATOR)
                .start();
    }

    public static void animateDismiss(@NonNull View content,
                                      @NonNull PopupPositioner.Placement placement,
                                      @NonNull Runnable onEnd) {
        content.animate().cancel();
        applyPivot(content, placement);
        float offset = PopupPositioner.dpToPx(content.getContext(), DISMISS_OFFSET_DP);
        content.animate()
                .alpha(0f)
                .scaleX(DISMISS_END_SCALE)
                .scaleY(DISMISS_END_SCALE)
                .translationX(resolveOffsetX(placement.side, offset))
                .translationY(resolveOffsetY(placement.side, offset))
                .setDuration(DISMISS_DURATION_MS)
                .setInterpolator(DISMISS_INTERPOLATOR)
                .withEndAction(() -> {
                    content.setAlpha(1f);
                    content.setScaleX(1f);
                    content.setScaleY(1f);
                    content.setTranslationX(0f);
                    content.setTranslationY(0f);
                    content.post(onEnd);
                })
                .start();
    }

    private static void applyPivot(@NonNull View content,
                                   @NonNull PopupPositioner.Placement placement) {
        float width = Math.max(1f, content.getWidth());
        float height = Math.max(1f, content.getHeight());
        boolean isRtl = content.getLayoutDirection() == View.LAYOUT_DIRECTION_RTL;
        content.setPivotX(resolvePivotX(width, placement, isRtl));
        content.setPivotY(resolvePivotY(height, placement));
    }

    private static float resolvePivotX(float width,
                                       @NonNull PopupPositioner.Placement placement,
                                       boolean isRtl) {
        switch (placement.side) {
            case LEFT:
                return width;
            case RIGHT:
                return 0f;
            case ABOVE:
            case BELOW:
            default:
                return resolveHorizontalPivot(width, placement.align, isRtl);
        }
    }

    private static float resolvePivotY(float height,
                                       @NonNull PopupPositioner.Placement placement) {
        switch (placement.side) {
            case ABOVE:
                return height;
            case BELOW:
                return 0f;
            case LEFT:
            case RIGHT:
            default:
                return resolveVerticalPivot(height, placement.align);
        }
    }

    private static float resolveHorizontalPivot(float width,
                                                @NonNull PopupPositioner.PopupAlign align,
                                                boolean isRtl) {
        switch (align) {
            case START:
                return isRtl ? width : 0f;
            case END:
                return isRtl ? 0f : width;
            case CENTER:
            default:
                return width * 0.5f;
        }
    }

    private static float resolveVerticalPivot(float height,
                                              @NonNull PopupPositioner.PopupAlign align) {
        switch (align) {
            case START:
                return 0f;
            case END:
                return height;
            case CENTER:
            default:
                return height * 0.5f;
        }
    }

    private static float resolveOffsetX(@NonNull PopupPositioner.PopupSide side, float offset) {
        switch (side) {
            case LEFT:
                return offset;
            case RIGHT:
                return -offset;
            default:
                return 0f;
        }
    }

    private static float resolveOffsetY(@NonNull PopupPositioner.PopupSide side, float offset) {
        switch (side) {
            case ABOVE:
                return offset;
            case BELOW:
                return -offset;
            default:
                return 0f;
        }
    }
}
