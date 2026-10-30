/**
 * Stackra file contract:
 * Purpose: `TREND_ICON`, the icon a change wears by its direction: a rising line, a falling line, or a dash for flat.
 * Boundary: data only, names from `@stackra/icons`. Internal: `trendOf` reads it.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0322 (generated constants for keys); STA-1371.
 */
import type { IconName } from "@stackra/icons/contracts";

/** The icon of each trend direction. */
export const TREND_ICON = Object.freeze({
  up: "trending-up",
  down: "trending-down",
  flat: "minus",
} as const satisfies Record<"up" | "down" | "flat", IconName>);
