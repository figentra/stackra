/**
 * Stackra file contract:
 * Purpose: the native `TamoMark`: Tamo's tile with its speech corner and two pill eyes, drawn from the brand kit's
 *          symbol with react-native-svg in the theme's `--color-tamo-mark` and `--color-tamo-mark-eyes`. Working, the
 *          eyes scan; error, they flatten.
 * Boundary: a mark only; it never mirrors in right-to-left (a logo keeps its shape). The scan stops under reduced
 *           motion (the brand's quiet rule).
 * Runtime: react-native
 * Governing contract: ADR 0507 (decision 4: the AI mark is Tamo's); figentra/brand brands/tamo/logo (the symbol);
 *          WCAG 2.2 SC 1.1.1, 2.3.3.
 */
import { useEffect, type ReactElement } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useCSSVariable } from "uniwind";

import type { TamoMarkProps } from "#native/tamo-mark/tamo-mark.props";

/** The tile with its speech corner at the bottom start (brand kit `favicon.svg`, 48 units). */
const TILE =
  "M18 4H30A14 14 0 0 1 44 18V30A14 14 0 0 1 30 44H7A3 3 0 0 1 4 41V18A14 14 0 0 1 18 4Z";
/** The two pill eyes. */
const EYES =
  "M18 14A3 3 0 0 1 21 17V24A3 3 0 0 1 18 27A3 3 0 0 1 15 24V17A3 3 0 0 1 18 14ZM30 14A3 3 0 0 1 33 17V24A3 3 0 0 1 30 27A3 3 0 0 1 27 24V17A3 3 0 0 1 30 14Z";
/** The error face: flat eyes, no motion (brand kit `tamo-error`). */
const FLAT_EYES = "M15 19.5H21V22.5H15ZM27 19.5H33V22.5H27Z";

/** One leg of the eyes' scan: half the brand kit's character.think loop (1400ms, alternate). */
// oxlint-disable-next-line stackra/no-literal-duration -- reason: the brand kit's Tamo character motion, not a theme step
const THINK_MS = 700;

/** The mark's side in points by size. */
const PX = { sm: 16, md: 20, lg: 28 } as const;

/** Tamo's mark. */
export function TamoMark({
  label,
  status = "idle",
  size = "md",
  className,
}: TamoMarkProps): ReactElement {
  const [tile, eyes] = useCSSVariable(["--color-tamo-mark", "--color-tamo-mark-eyes"]);
  const isReduced = useReducedMotion();
  const isScanning = status === "working" && !isReduced;
  const px = PX[size];
  const shift = useSharedValue(0);
  useEffect(() => {
    if (!isScanning) return;
    shift.set(-px / 24);
    shift.set(
      withRepeat(
        withTiming(px / 24, { duration: THINK_MS, easing: Easing.inOut(Easing.cubic) }),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(shift);
  }, [isScanning, px, shift]);
  const eyesStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shift.get() }] }));
  const box = { width: px, height: px };
  return (
    <View
      testID="tamo-mark"
      style={box}
      {...(className === undefined ? {} : { className })}
      {...(label
        ? { accessible: true, accessibilityRole: "image" as const, accessibilityLabel: label }
        : {
            accessibilityElementsHidden: true,
            importantForAccessibility: "no-hide-descendants" as const,
          })}
    >
      <Svg width={px} height={px} viewBox="0 0 48 48">
        <Path fill={String(tile ?? "")} d={TILE} />
      </Svg>
      <Animated.View
        style={[{ position: "absolute", top: 0, left: 0 }, box, isScanning ? eyesStyle : null]}
      >
        <Svg width={px} height={px} viewBox="0 0 48 48">
          <Path fill={String(eyes ?? "")} d={status === "error" ? FLAT_EYES : EYES} />
        </Svg>
      </Animated.View>
    </View>
  );
}
