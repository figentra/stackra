/**
 * Stackra file contract:
 * Purpose: `useClock(props)`, the state every runtime's Countdown shares: the milliseconds left (countdown) or gone
 *          (stopwatch), ticking once a second while running, and `onComplete` called once at zero.
 * Boundary: a React hook with no rendering; the runtimes draw the digits and announce; the web and native Countdown both use it.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave A).
 */
import { useEffect, useRef, useState } from "react";

import type { CountdownContractProps } from "#contracts/types/countdown-contract-props.type";

/** The ticking clock. */
export function useClock({
  mode = "countdown",
  to,
  from,
  isRunning = true,
  onComplete,
}: CountdownContractProps): number {
  const [now, setNow] = useState(() => Date.now());
  const [start] = useState(() => (from ? new Date(from).getTime() : Date.now()));
  const done = useRef(false);
  const left =
    mode === "countdown" ? Math.max(0, (to ? new Date(to).getTime() : now) - now) : now - start;
  const isOver = mode === "countdown" && left === 0;
  useEffect(() => {
    if (!isRunning || isOver) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isRunning, isOver]);
  useEffect(() => {
    if (isOver && !done.current) {
      done.current = true;
      onComplete?.();
    }
  }, [isOver, onComplete]);
  return left;
}
