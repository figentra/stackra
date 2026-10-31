/**
 * Stackra file contract:
 * Purpose: the web `CoachMark`: an onboarding tour that dims the page around each step's target (a spotlight
 *          cutout), pulses a beacon on it, and anchors a callout to it with the step's title and text, "Step n of
 *          m", Back, Next or Done, and Skip. The cutout glides from target to target.
 * Boundary: the callout is HeroUI's Popover content (React Aria) anchored by `triggerRef`: modal, so focus moves into
 *           it on each step and returns when the tour closes; Escape skips; a press outside does nothing. The
 *           spotlight and the beacon are decorative (`aria-hidden`). Under `prefers-reduced-motion` the cutout jumps
 *           and the beacon does not pulse. The cutout is a `--backdrop` box shadow, so the dim follows the theme.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5: adapted form); GAPS.md row 39 (owner decision 2026-10-28); WCAG
 *          2.2 SC 2.1.1, 2.4.3 and 2.3.3.
 */
import type { ReactElement } from "react";
import { Popover as HeroPopover } from "@heroui/react";
import { motionEasing, motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { motion, useReducedMotion } from "motion/react";
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "react-aria-components";

import type { CoachMarkOutcome } from "#contracts/enums/coach-mark-outcome.enum";
import { COACH_MARK_KEYS } from "#core/constants/coach-mark-keys.constant";
import { Button } from "#react/button/button";
import { useUiText } from "#react/hooks/use-ui-text";
import { Text } from "#react/text/text";
import type { CoachMarkProps } from "#react/coach-mark/coach-mark.props";

/** The tour's words. */
const K = COACH_MARK_KEYS.ui.coach_mark;

/** The cutout's glide between targets. */
const GLIDE = motionTiming(STACKRA_THEME, "base");
const PULSE = motionTiming(STACKRA_THEME, "pulse");
const ENTER_EASE = motionEasing(STACKRA_THEME, "enter");

/** The room left around the target inside the cutout, in px. */
const PAD = 6;

/** The beacon's dot and ring: a circle by geometry, not a theme radius. */
const DOT = { borderRadius: "50%" } as const;

/** The cutout's box: the target's, grown by the padding. */
type Box = {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
};

/** Each step of a tour spotlit in turn, with a callout anchored to it. */
export function CoachMark({
  steps,
  isOpen,
  defaultOpen,
  onOpenChange,
  onFinish,
}: CoachMarkProps): ReactElement | null {
  const t = useUiText();
  const isReduced = useReducedMotion() ?? false;
  const { direction } = useLocale();
  const [innerOpen, setInnerOpen] = useState(defaultOpen ?? false);
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | undefined>(undefined);
  const open = (isOpen ?? innerOpen) && steps.length > 0;
  const step = steps[Math.min(index, steps.length - 1)];
  const isLast = index >= steps.length - 1;

  // Measure the target, bring it on screen, and follow it as the page scrolls or resizes.
  useLayoutEffect(() => {
    const target = open ? step?.target.current : undefined;
    if (!target) return;
    target.scrollIntoView?.({ block: "nearest", behavior: isReduced ? "auto" : "smooth" });
    const measure = () => {
      const rect = target.getBoundingClientRect();
      setBox({
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, step, isReduced]);

  const finish = (outcome: CoachMarkOutcome) => {
    if (isOpen === undefined) setInnerOpen(false);
    onOpenChange?.(false);
    onFinish?.(outcome);
    setIndex(0);
  };

  if (!open || step === undefined) return null;
  const glide = isReduced
    ? "none"
    : ["top", "left", "width", "height"]
        .map((side) => `${side} ${GLIDE.durationMs}ms ease-in-out`)
        .join(", ");
  return (
    <>
      {box === undefined
        ? null
        : createPortal(
            <div
              aria-hidden
              data-slot="coach-mark-spotlight"
              className="pointer-events-none fixed inset-0 z-(--z-float)"
            >
              <div
                data-slot="coach-mark-cutout"
                className="absolute"
                style={{
                  ...box,
                  borderRadius: "var(--radius)",
                  boxShadow: "0 0 0 200vmax var(--backdrop)",
                  transition: glide,
                }}
              />
              <span
                data-slot="coach-mark-beacon"
                className="absolute size-3 -translate-x-1/2 -translate-y-1/2"
                style={{
                  top: box.top,
                  left: direction === "rtl" ? box.left : box.left + box.width,
                  transition: glide,
                }}
              >
                {isReduced ? null : (
                  <motion.span
                    className="absolute inset-0 bg-accent"
                    style={DOT}
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 2.4, opacity: 0 }}
                    transition={{
                      duration: (PULSE.durationMs * 1.5) / 1000,
                      repeat: Infinity,
                      ease: ENTER_EASE,
                    }}
                  />
                )}
                <span className="absolute inset-0 bg-accent" style={DOT} />
              </span>
            </div>,
            document.body,
          )}
      <HeroPopover.Content
        key={step.id}
        triggerRef={step.target}
        isOpen
        onOpenChange={(next) => {
          if (!next) finish("skipped");
        }}
        shouldCloseOnInteractOutside={() => false}
        placement="bottom"
        data-slot="coach-mark"
      >
        <HeroPopover.Arrow />
        <HeroPopover.Dialog className="grid max-w-xs gap-2">
          <HeroPopover.Heading level={2}>{step.title}</HeroPopover.Heading>
          {step.description == null ? null : <Text type="small">{step.description}</Text>}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Text type="caption" tone="muted" className="me-auto">
              {t(K.progress, { current: index + 1, total: steps.length })}
            </Text>
            <Button size="sm" variant="ghost" onPress={() => finish("skipped")}>
              {t(K.skip)}
            </Button>
            {index === 0 ? null : (
              <Button size="sm" variant="secondary" onPress={() => setIndex(index - 1)}>
                {t(K.back)}
              </Button>
            )}
            <Button size="sm" onPress={() => (isLast ? finish("done") : setIndex(index + 1))}>
              {isLast ? t(K.done) : t(K.next)}
            </Button>
          </div>
        </HeroPopover.Dialog>
      </HeroPopover.Content>
    </>
  );
}
