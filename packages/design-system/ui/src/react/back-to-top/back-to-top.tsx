/**
 * Stackra file contract:
 * Purpose: the web `BackToTop`: a round button that appears once the window (or `scrollRef`) is scrolled past
 *          `threshold`, scrolls back to the top (smoothly, instantly under reduced motion) and moves focus to
 *          `focusTargetId`, or the scrolling element, so a keyboard user starts again from the top.
 * Boundary: fixed to the viewport's bottom inline-end corner (bottom left in Arabic); with `scrollRef` it is
 *           absolute instead, so put it in a positioned wrapper around the container. The button leaves the page
 *           once at the top, which is why focus is moved first.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 2.4.3 and 2.3.3; STA-1371
 *          (wave D, owner approval 2026-10-30).
 */
import { cn } from "@heroui/react";
import { ArrowUp } from "@stackra/icons/react/lucide-icons";
import { motion, useReducedMotion } from "motion/react";
import { type ReactElement, useEffect, useState } from "react";

import { LONG_TAIL_KEYS } from "#core/constants/long-tail-keys.constant";
import type { BackToTopProps } from "#react/back-to-top/back-to-top.props";
import { useUiText } from "#react/hooks/use-ui-text";
import { IconButton } from "#react/icon-button/icon-button";

/** The button's words. */
const K = LONG_TAIL_KEYS.ui.back_to_top;

/** A button back to the top. */
export function BackToTop({
  threshold = 400,
  label,
  scrollRef,
  focusTargetId,
  className,
}: BackToTopProps): ReactElement | null {
  const t = useUiText();
  const isReduced = useReducedMotion() ?? false;
  const [isShown, setIsShown] = useState(false);

  useEffect(() => {
    const element = scrollRef?.current ?? null;
    const target: HTMLElement | Window = element ?? window;
    const check = () => setIsShown((element ? element.scrollTop : window.scrollY) > threshold);
    check();
    target.addEventListener("scroll", check, { passive: true });
    return () => target.removeEventListener("scroll", check);
  }, [scrollRef, threshold]);

  if (!isShown) return null;

  const goTop = () => {
    const element = scrollRef?.current ?? null;
    const focus =
      (focusTargetId ? document.getElementById(focusTargetId) : null) ?? element ?? document.body;
    // Not every target takes focus by itself; -1 lets a script focus it without adding a tab stop.
    if (focus.tabIndex < 0 && !focus.hasAttribute("tabindex")) focus.setAttribute("tabindex", "-1");
    focus.focus({ preventScroll: true });
    (element ?? window).scrollTo({ top: 0, behavior: isReduced ? "auto" : "smooth" });
  };

  return (
    <motion.div
      data-slot="back-to-top"
      initial={isReduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("end-6 bottom-6 z-(--z-float)", scrollRef ? "absolute" : "fixed", className)}
    >
      <IconButton
        icon={<ArrowUp size={18} aria-hidden />}
        label={label ?? t(K.label)}
        variant="secondary"
        className="shadow-overlay"
        onPress={goTop}
      />
    </motion.div>
  );
}
