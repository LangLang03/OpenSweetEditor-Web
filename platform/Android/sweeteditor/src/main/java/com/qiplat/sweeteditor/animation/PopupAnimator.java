package com.qiplat.sweeteditor.animation;

import android.view.View;
import android.view.animation.AccelerateInterpolator;
import android.view.animation.OvershootInterpolator;

import androidx.annotation.NonNull;

import com.qiplat.sweeteditor.popup.PopupPositioner;

/**
 * Shared bubble-style animation for floating popup surfaces.
 */
public final class PopupAnimator {

    private static final int SHOW_DURATION_MS = 180;
    private static final int DISMISS_DURATION_MS = 110;
    private static final int SHOW_OFFSET_DP = 10;
    private static final int DISMISS_OFFSET_DP = 6;
    private static final float START_ALPHA = 0f;
    private static final OvershootInterpolator SHOW_INTERPOLATOR = new OvershootInterpolator(0.7f);
    private static final AccelerateInterpolator DISMISS_INTERPOLATOR = new AccelerateInterpolator(1.25f);

    private PopupAnimator() {
    }

    public static void prepareForShow(@NonNull View content,
                                      @NonNull PopupPositioner.PopupSide side) {
        content.animate().cancel();
        content.clearAnimation();
        float offset = PopupPositioner.dpToPx(content.getContext(), SHOW_OFFSET_DP);
        content.setAlpha(START_ALPHA);
        content.setTranslationX(resolveOffsetX(side, offset));
        content.setTranslationY(resolveOffsetY(side, offset));
    }

    public static void animateShow(@NonNull View content,
                                   @NonNull PopupPositioner.PopupSide side) {
        content.animate().cancel();
        content.animate()
                .alpha(1f)
                .translationX(0f)
                .translationY(0f)
                .setDuration(SHOW_DURATION_MS)
                .setInterpolator(SHOW_INTERPOLATOR)
                .start();
    }

    public static void animateDismiss(@NonNull View content,
                                      @NonNull PopupPositioner.PopupSide side,
                                      @NonNull Runnable onEnd) {
        content.animate().cancel();
        float offset = PopupPositioner.dpToPx(content.getContext(), DISMISS_OFFSET_DP);
        content.animate()
                .alpha(0f)
                .translationX(resolveOffsetX(side, offset))
                .translationY(resolveOffsetY(side, offset))
                .setDuration(DISMISS_DURATION_MS)
                .setInterpolator(DISMISS_INTERPOLATOR)
                .withEndAction(() -> {
                    content.setAlpha(1f);
                    content.setTranslationX(0f);
                    content.setTranslationY(0f);
                    content.post(onEnd);
                })
                .start();
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
