/**
 * Stackra file contract:
 * Purpose: `useAutoHide(delayMs)`, the visibility of chrome that slides away after a quiet spell: `isVisible`,
 *          `show()`, which brings it back and restarts the clock, and `hold(isHeld)`, which keeps it while it has
 *          focus or the pointer.
 * Boundary: internal, in the shared React layer; the web and native FullscreenBar import it by path. `false` never
 *           hides. Listening for activity is each runtime's.
 * Runtime: isomorphic
 * Governing contract: ADR 0004 §1 (layer direction); GAPS.md row 32 (owner decision 2026-10-28); WCAG 2.2 SC 2.2.1.
 */
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Visibility that times out.
 *
 * @example
 * const { isVisible, show, hold } = useAutoHide(4000);
 */
export function useAutoHide(delayMs: number | false): {
  isVisible: boolean;
  show: () => void;
  hold: (isHeld: boolean) => void;
} {
  const [isVisible, setVisible] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const held = useRef(false);

  const arm = useCallback(() => {
    clearTimeout(timer.current);
    if (delayMs === false || held.current) return;
    timer.current = setTimeout(() => setVisible(false), delayMs);
  }, [delayMs]);

  const show = useCallback(() => {
    setVisible(true);
    arm();
  }, [arm]);

  const hold = useCallback(
    (isHeld: boolean) => {
      held.current = isHeld;
      if (isHeld) clearTimeout(timer.current);
      else arm();
    },
    [arm],
  );

  useEffect(() => {
    arm();
    return () => clearTimeout(timer.current);
  }, [arm]);

  return { isVisible: isVisible || delayMs === false, show, hold };
}
