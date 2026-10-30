/**
 * Stackra file contract:
 * Purpose: `ChartCrosshair`, the native scrubbing indicator: while a finger is on a Victory chart it draws a soft band
 *          behind the touched category (columns), a 1px dashed muted guide (lines), and a dot in each line's colour
 *          ringed in the surface colour so it separates from the stroke.
 * Boundary: Skia shapes only, inside the chart's own canvas; it follows the press state on the UI thread and draws
 *           nothing while the chart is not pressed. A new piece beside `CartesianFigure`'s cursor, which it does not
 *           touch. No text, so no bidi concerns; position comes from Victory, which already runs right to left.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); chart style spec (2026-10-28) sections 3 and 6;
 *          WCAG 2.2 SC 1.4.11; STA-1371.
 */
import { Circle, DashPathEffect, Group, Line, Rect, vec } from "@shopify/react-native-skia";
import type { ReactElement } from "react";
import { useDerivedValue } from "react-native-reanimated";

import type { ChartCrosshairProps } from "#native/chart-crosshair/chart-crosshair.props";

/** One ringed dot on a line series at the scrubbed point. */
function Dot({ state, dotKey, color, ring }: { state: ChartCrosshairProps["state"]; dotKey: string; color: string; ring: string }) {
  const y = useDerivedValue(() => state.y[dotKey]?.position.value ?? -100);
  return (
    <Group>
      <Circle cx={state.x.position} cy={y} r={6} color={ring} />
      <Circle cx={state.x.position} cy={y} r={4} color={color} />
    </Group>
  );
}

/** The band, guide and dots at the scrubbed category. */
export function ChartCrosshair(props: ChartCrosshairProps): ReactElement {
  const { state, bounds, dots = [], bandWidth = 0 } = props;
  const opacity = useDerivedValue(() => (state.isActive.value ? 1 : 0));
  const from = useDerivedValue(() => vec(state.x.position.value, bounds.top));
  const to = useDerivedValue(() => vec(state.x.position.value, bounds.bottom));
  const bandX = useDerivedValue(() => state.x.position.value - bandWidth / 2);
  return (
    <Group opacity={opacity}>
      {bandWidth > 0 ? (
        <Rect
          x={bandX}
          y={bounds.top}
          width={bandWidth}
          height={bounds.bottom - bounds.top}
          color={props.bandColor}
          opacity={0.05}
        />
      ) : null}
      <Line p1={from} p2={to} color={props.guideColor} strokeWidth={1}>
        <DashPathEffect intervals={[4, 4]} />
      </Line>
      {dots.map((dot) => (
        <Dot key={dot.key} state={state} dotKey={dot.key} color={dot.color} ring={props.ringColor} />
      ))}
    </Group>
  );
}
