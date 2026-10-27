/**
 * Stackra file contract:
 * Purpose: `DemoChartTickProps`: the props recharts hands an axis tick: the text's own, plus the tick's value, index
 *          and the axis's formatter.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */
import type { Text } from "recharts";
import type { ComponentProps } from "react";

/** The props recharts hands an axis tick: the text's own, plus the tick's value, index and the axis's formatter. */
export type DemoChartTickProps = Omit<ComponentProps<typeof Text>, "children"> & {
  /** The tick's value. */
  readonly payload?: { readonly value?: unknown } | undefined;
  /** The index of the tick on the axis. */
  readonly index?: number | undefined;
  /** The formatter of the axis. */
  readonly tickFormatter?: ((value: never, index: number) => string) | undefined;
  /** How many ticks the axis draws; recharts passes it and the text has no use for it. */
  readonly visibleTicksCount?: number | undefined;
};
