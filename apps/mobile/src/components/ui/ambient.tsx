/**
 * Stackra file contract:
 * Purpose: the ambient field under the glass, the native twin of the web playground's `.ambient`: the theme's
 *          background with three soft glows (a cool one from the top start, a warm one from the top end, a light one
 *          from the bottom), each a theme role at a low opacity, so the glass has something to refract while the text
 *          on it keeps the contrast it has on the background.
 * Boundary: decoration only: hidden from assistive technology and from touches; every colour is a theme role.
 * Runtime: react-native
 * Governing contract: ADR 0320 (glass and the showcase stage); ADR 0060 (light, dark).
 */
import { useThemeColor } from "heroui-native";
import { View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

/** Each glow: its centre and radius (fractions of the field) and its role's opacity at the centre. */
const GLOWS = [
  { id: "ambient-a", cx: "0.08", cy: "0", r: "0.9", opacity: 0.22 },
  { id: "ambient-b", cx: "0.96", cy: "0.12", r: "0.7", opacity: 0.1 },
  { id: "ambient-c", cx: "0.5", cy: "1", r: "0.9", opacity: 0.7 },
] as const;

/** The ambient field: fills its parent, behind everything in it. */
export function Ambient() {
  // The cool glow is the muted role, the warm one the warning role (the brand's amber), the light one the surface.
  const [muted, warning, surface] = useThemeColor(["muted", "warning", "surface"]);
  const glows = GLOWS.map((glow, index) => ({
    ...glow,
    color: [muted, warning, surface][index] ?? muted,
  }));
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="absolute inset-0 bg-background"
    >
      <Svg width="100%" height="100%">
        <Defs>
          {glows.map(({ id, cx, cy, r, opacity, color }) => (
            <RadialGradient key={id} id={id} cx={cx} cy={cy} r={r} fx={cx} fy={cy}>
              <Stop offset="0" stopColor={color} stopOpacity={opacity} />
              <Stop offset="0.7" stopColor={color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        {GLOWS.map(({ id }) => (
          <Rect key={id} width="100%" height="100%" fill={`url(#${id})`} />
        ))}
      </Svg>
    </View>
  );
}
