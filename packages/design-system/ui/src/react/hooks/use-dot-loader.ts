/**
 * Stackra file contract:
 * Purpose: the lit dots of a running indeterminate dot loader on the web, stepped by one timer per change.
 * Boundary: timing only; the drawing is `DotGrid`. Not exported from `./react`.
 * Runtime: browser
 * Governing contract: .agents/specs/sta-2017-dot-loader/spec.md (FR-002, FR-007)
 */
import { useEffect, useState } from "react";

import { dotLoaderLit } from "#core/functions/dot-loader-lit.function";

/** The lit dots of a `count`-dot build; every dot, still, while `isRunning` is false (reduced motion). */
export function useDotLoader(count: number, isRunning: boolean): number {
  const [lit, setLit] = useState(1);
  useEffect(() => {
    if (!isRunning) return undefined;
    const start = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const step = (): void => {
      const now = dotLoaderLit(Date.now() - start, count);
      setLit(now.lit);
      timer = setTimeout(step, now.nextMs);
    };
    // The first step runs on the timer too, so a restart begins at the first dot without a render from the effect.
    timer = setTimeout(step, 0);
    return () => clearTimeout(timer);
  }, [count, isRunning]);
  return isRunning ? lit : count;
}
