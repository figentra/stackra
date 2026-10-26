/**
 * Stackra file contract:
 * Purpose: `NumberValueProps`, props of the web NumberValue: HeroUI Pro's own root props, passed through unchanged,
 *          plus `isAnimated`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0329 (motion layer); ADR 0310 (decision 3); ADR 0303 (decision
 *                     7); STA-416 FR-005.
 */
import type { NumberValueRootProps as HeroNumberValueRootProps } from "@heroui-pro/react/number-value";

/** Props of the web NumberValue: HeroUI Pro's own root props, passed through unchanged, plus `isAnimated`. */
export type NumberValueProps = HeroNumberValueRootProps & {
  /** Roll the number to a new value instead of swapping it; on by default. */
  isAnimated?: boolean | undefined;
};
