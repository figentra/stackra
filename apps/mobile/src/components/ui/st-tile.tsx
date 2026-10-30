/**
 * Stackra file contract:
 * Purpose: the Stackra st tile drawn with react-native-svg, as the brand draws it from 32px up: a white (light) or
 *          graphite (dark) tile with a hairline edge and the beam-S and t in the artwork colour, coloured by the
 *          theme's `stk-tile`, `stk-tile-line` and `stk-ink` roles.
 * Boundary: the artwork only, decorative (hidden from assistive technology). The geometry is the brand's
 *           brands/stackra/logo/stackra-symbol.svg at the sha `brand.json` pins (figentra/brand 17f24d2; the colours
 *           by scheme); redraw it when the pin moves. Never animated and never glass (brand rule, ADR 0320 decision 5).
 * Runtime: react-native
 * Governing contract: ADR 0320 (glass and the showcase stage); the stackra brand kit.
 */
import Svg, { Path, Rect } from "react-native-svg";
import { useCSSVariable } from "uniwind";

import type { StTileProps } from "./st-tile.props";

/** The beam-S and the t, one path on the 16 u artboard (the brand's stackra-symbol.svg). */
const ST =
  "M7.25 6.23L3.815 6.23C3.227 6.23 2.75 6.707 2.75 7.295L2.75 8.18C2.75 8.768 3.227 9.245 3.815 9.245L6.185 9.245C6.381 9.245 6.54 9.404 6.54 9.6L6.54 10.485C6.54 10.681 6.381 10.84 6.185 10.84L2.75 10.84L2.75 11.55L6.185 11.55C6.773 11.55 7.25 11.073 7.25 10.485L7.25 9.6C7.25 9.012 6.773 8.535 6.185 8.535L3.815 8.535C3.619 8.535 3.46 8.376 3.46 8.18L3.46 7.295C3.46 7.099 3.619 6.94 3.815 6.94L7.25 6.94ZM11.36 11.55Q9.76 11.55 9.76 10.02L9.76 7.08L8.08 7.08L8.08 6.23L9.76 6.23L9.76 4.98L10.77 4.98L10.77 6.23L12.84 6.23L12.84 7.08L10.77 7.08L10.77 9.97Q10.77 10.7 11.47 10.7L12.84 10.7L12.84 11.55Z";

/** The st tile at `size` points. */
export function StTile({ size }: StTileProps) {
  const [tile = "transparent", line = "transparent", ink = "transparent"] = useCSSVariable([
    "--color-stk-tile",
    "--color-stk-tile-line",
    "--color-stk-ink",
  ]).map(String);
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Rect
        x={0.25}
        y={0.25}
        width={15.5}
        height={15.5}
        rx={3.5}
        fill={tile}
        stroke={line}
        strokeWidth={0.5}
      />
      <Path fill={ink} d={ST} />
    </Svg>
  );
}
