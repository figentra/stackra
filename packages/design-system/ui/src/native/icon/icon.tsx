/**
 * Stackra file contract:
 * Purpose: the native `Icon`: draws a lucide-react-native icon (or any component with the same props) at a Stackra
 *          size and in a tone's resolved theme colour (`useThemeColor`), hidden from VoiceOver and TalkBack unless it
 *          has a label, and mirrored in right-to-left (`useIsRTL`) when it points the reading way.
 * Boundary: draws one Svg; without a size or tone it follows the nearest LucideProvider (the holder's, or the
 *          DesignSystemProvider's default). React Native ignores `aria-*` on the Svg host view, so accessibility goes
 *          through the `accessibility*` props.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decisions 3 and 7); ADR 0165 (HeroUI Native on native);
 *          ADR 0060 (RTL).
 */
import { useIsRTL, useThemeColor } from "heroui-native";
import type { LucideProps } from "lucide-react-native";
import type { ComponentType } from "react";

import type { IconContractProps } from "#contracts/types/icon-contract-props.type";
import { ICON_SIZES } from "#core/constants/icon-sizes.constant";

/** Svg and View props that reach the drawn icon; the contract's props, colour and accessibility stay the wrapper's. */
type IconPassthroughProps = Omit<
  LucideProps,
  | keyof IconContractProps
  | "color"
  | "width"
  | "height"
  | "absoluteStrokeWidth"
  | "role"
  | "aria-label"
  | "aria-hidden"
  | "accessible"
  | "accessibilityLabel"
  | "accessibilityRole"
  | "accessibilityElementsHidden"
  | "importantForAccessibility"
>;

/** Props of the native Icon: the shared contract plus the Svg and View props lucide-react-native takes. */
export type IconProps = IconContractProps & IconPassthroughProps;

/** The mirror: a horizontal flip, put after the caller's style so it cannot be cancelled. */
const MIRRORED_STYLE = { transform: [{ scaleX: -1 }] } as const;

/**
 * Draws a lucide-react-native icon, or any component with the same props, at a Stackra size and tone. Without a
 * `label` it is decorative and hidden from screen readers. Without a `size` or `tone` it takes the holder's.
 */
export function Icon({ as, size, tone, label, isMirroredInRtl, style, ...rest }: IconProps) {
  const isRtl = useIsRTL();
  // Called on every render, so the hook order is stable; the colour is used only when a tone is given.
  const toneColor = useThemeColor(tone === undefined || tone === "default" ? "foreground" : tone);
  // A cast, not an assignment: the contract's component props leave out `undefined` on purpose (so every Lucide icon
  // is an IconComponent under exactOptionalPropertyTypes), which makes the reverse direction fail to compile.
  const Drawn = as as ComponentType<Omit<LucideProps, "color"> & { color?: string }>;
  const name = label
    ? { accessible: true, role: "img" as const, accessibilityLabel: label }
    : {
        accessible: false,
        accessibilityElementsHidden: true,
        importantForAccessibility: "no-hide-descendants" as const,
      };

  return (
    <Drawn
      {...(size ? { size: ICON_SIZES[size] } : {})}
      {...(tone ? { color: toneColor } : {})}
      {...rest}
      {...name}
      style={isMirroredInRtl && isRtl ? [style, MIRRORED_STYLE] : style}
    />
  );
}
