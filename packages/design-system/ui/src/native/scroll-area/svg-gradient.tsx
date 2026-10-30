/**
 * Stackra file contract:
 * Purpose: `SvgGradient`, the linear gradient HeroUI Native's ScrollShadow paints its fades with, drawn with
 *          react-native-svg (a dependency the kit already has) instead of a new gradient package.
 * Boundary: internal to ScrollArea; takes the colours, stops and start/end points ScrollShadow hands it.
 * Runtime: react-native
 * Governing contract: ADR 0302; STA-1371 (wave A: no new dependency).
 */
import { useId, type ReactElement } from "react";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

/** A point from 0 to 1 on each axis. */
type Point = { readonly x: number; readonly y: number };

/** The default start: the top. */
const TOP: Point = { x: 0, y: 0 };

/** The default end: the bottom. */
const BOTTOM: Point = { x: 0, y: 1 };

/** A linear gradient filling its box. */
export function SvgGradient({
  colors,
  locations,
  start = TOP,
  end = BOTTOM,
  style,
}: {
  readonly colors: readonly string[];
  readonly locations?: readonly number[];
  readonly start?: Point;
  readonly end?: Point;
  readonly style?: object;
}): ReactElement {
  const id = useId();
  return (
    <Svg style={style} pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1={start.x} y1={start.y} x2={end.x} y2={end.y}>
          {colors.map((color, index) => (
            <Stop
              // oxlint-disable-next-line react/no-array-index-key -- gradient stops are ordered colours that may repeat; their place is their identity
              key={index}
              offset={locations?.[index] ?? index / Math.max(1, colors.length - 1)}
              stopColor={color}
            />
          ))}
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
