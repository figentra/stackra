/**
 * Stackra file contract:
 * Purpose: `useFloorSteps`, the one whole-step reveal of the blueprint motion (`Schematic`'s pipes, `TerminalDemo`'s
 *          lines, `MonoDisplay`'s floors): at the `full` motion level it rewinds before paint, waits until the element
 *          is in view (or starts at once), then counts up one step per theme `floor` step (no easing) and holds on the
 *          last. It returns how many steps are drawn: `Infinity` whenever it does not play, so a still page, the
 *          server and a drop below `full` mid-play all draw everything.
 * Boundary: state and timers only; the caller owns the element and what a step draws. With no IntersectionObserver
 *           it starts at once.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); motion principles (one orchestrated moment, the `floor` motion step);
 *          WCAG 2.2 SC 2.3.3; STA-2041.
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { type RefObject, useEffect, useLayoutEffect, useState } from "react";

import { useMotion } from "#react/design-system-provider/use-motion";
import type { FloorStepsOptions } from "#react/hooks/floor-steps-options.type";

/** The theme's floor step: one whole step, no easing. */
const FLOOR_MS = motionTiming(STACKRA_THEME, "floor").durationMs;

/**
 * Plays a whole-step reveal of `total` steps on `element` once it comes into view.
 * @returns the steps drawn, `Infinity` when it does not play
 */
export function useFloorSteps(
  element: RefObject<Element | null>,
  {
    total,
    isEnabled = true,
    startsAtOnce = false,
    threshold = 0.2,
    stepMs = FLOOR_MS,
  }: FloorStepsOptions,
): number {
  const motion = useMotion();
  const plays = isEnabled && motion === "full";
  // Everything drawn first, as the server and the edge draw it.
  const [step, setStep] = useState(Number.POSITIVE_INFINITY);
  const [isStarted, setIsStarted] = useState(startsAtOnce);

  // Before paint, so a reveal about to play never flashes its last frame.
  useLayoutEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- reason: a still page draws everything; only a playing one rewinds
    if (plays) setStep(0);
  }, [plays]);

  useEffect(() => {
    const target = element.current;
    if (!plays || isStarted || !target) return undefined;
    if (typeof IntersectionObserver !== "function") {
      // oxlint-disable-next-line react/set-state-in-effect -- reason: with no IntersectionObserver there is no view to wait for
      setIsStarted(true);
      return undefined;
    }
    const sight = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setIsStarted(true);
      },
      { threshold },
    );
    sight.observe(target);
    return () => sight.disconnect();
  }, [element, plays, isStarted, threshold]);

  useEffect(() => {
    if (!plays || !isStarted || step >= total) return undefined;
    const next = setTimeout(() => setStep((count) => count + 1), stepMs);
    return () => clearTimeout(next);
  }, [plays, isStarted, step, total, stepMs]);

  return plays ? step : Number.POSITIVE_INFINITY;
}
