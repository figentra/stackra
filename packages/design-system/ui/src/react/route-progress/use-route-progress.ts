/**
 * Stackra file contract:
 * Purpose: `useRouteProgress(isLoading, isReduced)`, the trickle both `RouteProgress` runtimes draw: while loading the
 *          fill starts at 8% and closes a tenth of the gap to 90% every 250 ms (never reaching the end); when loading
 *          stops it jumps to 100% and stays drawn for the fade, then hides and resets. Reduced motion holds a still
 *          fill instead of trickling.
 * Boundary: the shared React layer (native composes react, ADR 0004 §1); internal, imported by path; no DOM.
 * Runtime: isomorphic
 * Governing contract: gap inventory row 29 (owner approval 2026-10-28); ADR 0004 §1; WCAG 2.2 SC 2.3.3.
 */
import { useEffect, useState } from "react";

import { ROUTE_PROGRESS_TIMING } from "#core/constants/route-progress-timing.constant";
import type { RouteProgressState } from "#core/types/route-progress-state.type";

const { start: START, ceiling: CEILING, step: STEP, trickleMs, fadeMs } = ROUTE_PROGRESS_TIMING;

/** The bar's fill and visibility for a loading flag. */
export function useRouteProgress(isLoading: boolean, isReduced: boolean): RouteProgressState {
  const [wasLoading, setWasLoading] = useState(isLoading);
  const [steps, setSteps] = useState(0);
  const [isFading, setFading] = useState(false);
  // A change of the flag restarts the trickle or starts the fade, adjusted during render rather than in an effect.
  if (wasLoading !== isLoading) {
    setWasLoading(isLoading);
    setSteps(0);
    setFading(!isLoading);
  }
  useEffect(() => {
    if (isLoading && !isReduced) {
      const timer = setInterval(() => setSteps((now) => now + 1), trickleMs);
      return () => clearInterval(timer);
    }
    if (!isFading) return undefined;
    const timer = setTimeout(() => setFading(false), fadeMs);
    return () => clearTimeout(timer);
  }, [isLoading, isReduced, isFading]);
  // Each step closes STEP of the gap to the ceiling: ceiling - (ceiling - start) * (1 - step) ^ steps.
  const trickled = CEILING - (CEILING - START) * (1 - STEP) ** steps;
  const value = isLoading ? (isReduced ? CEILING : trickled) : isFading ? 1 : 0;
  return { value, isVisible: isLoading || isFading };
}
