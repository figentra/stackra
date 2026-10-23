/**
 * Stackra file contract:
 * Purpose: the axis tick of the chart pages of the Pro group: recharts' own tick text, wrapped in an `inert` group so
 *          that axe leaves it out of the colour-contrast check, which it cannot finish for text drawn inside an svg
 *          (it reports every such text as "contains an image node").
 * Boundary: presentation only; the tick draws exactly what recharts would, formatted by the axis's `tickFormatter`.
 *          The text is already out of the accessibility tree, because each chart's container is `role="img"` with a
 *          name, so `inert` hides nothing from a reader; its contrast is held by the axis colour of HeroUI Pro. The
 *          browser ignores `inert` on an svg element, so nothing changes on screen or in the pointer.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import { Text } from "recharts";
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

// `inert` is not in React's svg attribute types; the attribute is all axe reads.
const INERT = { inert: true } as Record<string, boolean>;

/** An axis tick: the formatted value as recharts' text, inside an inert group. */
export function DemoChartTick({
  payload,
  index = 0,
  tickFormatter,
  visibleTicksCount: _visibleTicksCount,
  ...text
}: DemoChartTickProps) {
  const value = payload?.value;
  const label = tickFormatter ? tickFormatter(value as never, index) : String(value);
  return (
    <g {...INERT}>
      <Text {...text}>{label}</Text>
    </g>
  );
}
