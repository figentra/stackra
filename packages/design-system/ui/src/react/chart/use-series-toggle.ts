/**
 * Stackra file contract:
 * Purpose: `useSeriesToggle`, the series a reader has hidden through a chart's legend and the toggle the legend calls.
 * Boundary: a React hook over local state; the chart keeps its colours by position, so hiding one never repaints another.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.1.1 and 4.1.2; STA-1371.
 */
import { useState } from "react";

/** The hidden series' keys and the toggle of one key. */
export function useSeriesToggle(): {
  readonly hidden: readonly string[];
  readonly toggle: (key: string) => void;
} {
  const [hidden, setHidden] = useState<readonly string[]>([]);
  return {
    hidden,
    toggle: (key) =>
      setHidden((keys) =>
        keys.includes(key) ? keys.filter((item) => item !== key) : [...keys, key],
      ),
  };
}
