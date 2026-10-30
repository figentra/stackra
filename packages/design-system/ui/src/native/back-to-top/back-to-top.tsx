/**
 * Stackra file contract:
 * Purpose: the native `BackToTop`: a round button that fades in once `offsetY` passes `threshold` and scrolls
 *          `scrollRef` back to the top, animated unless Reduce Motion is on.
 * Boundary: absolute at the bottom inline-end corner of its parent (bottom left in Arabic), so render it beside the
 *           scroll view inside a full-size parent. Screen reader focus stays with the screen; the button leaves once
 *           at the top.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); STA-1371 (wave D, owner approval 2026-10-30).
 */
import { ArrowUp } from "@stackra/icons/native/lucide-icons";
import type { ReactElement } from "react";
import Animated, { FadeIn, FadeOut, useReducedMotion } from "react-native-reanimated";

import { LONG_TAIL_KEYS } from "#core/constants/long-tail-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import type { BackToTopProps } from "#native/back-to-top/back-to-top.props";
import { IconButton } from "#native/icon-button/icon-button";

/** The button's words. */
const K = LONG_TAIL_KEYS.ui.back_to_top;

/** A button back to the top. */
export function BackToTop({
  threshold = 400,
  label,
  scrollRef,
  offsetY,
  className,
}: BackToTopProps): ReactElement | null {
  const t = useUiText();
  const isReduced = useReducedMotion();
  if (offsetY <= threshold) return null;
  const goTop = () => {
    const view = scrollRef.current;
    if (!view) return;
    if ("scrollToOffset" in view) view.scrollToOffset({ offset: 0, animated: !isReduced });
    else view.scrollTo({ y: 0, animated: !isReduced });
  };
  return (
    <Animated.View
      {...(isReduced ? {} : { entering: FadeIn, exiting: FadeOut })}
      className={["absolute end-6 bottom-6", className].filter(Boolean).join(" ")}
    >
      <IconButton
        icon={<ArrowUp size={18} />}
        label={label ?? t(K.label)}
        variant="secondary"
        className="shadow-md"
        onPress={goTop}
      />
    </Animated.View>
  );
}
