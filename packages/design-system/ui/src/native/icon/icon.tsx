/**
 * Stackra file contract:
 * Purpose: the native `Icon`: draws an icon by name, resolved through the `@stackra/icons` registry, at a Stackra
 *          size and in a tone's resolved theme colour (`useThemeColor`), hidden from VoiceOver and TalkBack unless it
 *          has a label, and mirrored in right-to-left (`useIsRTL`) when it points the reading way.
 * Boundary: draws one Svg, or nothing for a name no registry holds; without a size or tone it follows the nearest LucideProvider (the holder's, or the
 *          DesignSystemProvider's default). React Native ignores `aria-*` on the Svg host view, so accessibility goes
 *          through the `accessibility*` props.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decisions 3 and 7); ADR 0165 (HeroUI Native on native);
 *          ADR 0060 (RTL); ADR 0303 (decision 10).
 */
import { findIcon } from "@stackra/icons";
import { useIcon } from "@stackra/icons/native";
import { useIsRTL, useThemeColor } from "heroui-native";
import type { LucideProps } from "lucide-react-native";
import type { ComponentType, ReactElement } from "react";

import { ICON_SIZES } from "#core/constants/icon-sizes.constant";
import { warnUnknownIcon } from "#core/functions/warn-unknown-icon.function";
import { UI_ICONS } from "#native/icon/ui-icons.constant";
import type { IconProps } from "#native/icon/icon.props";

/** The mirror: a horizontal flip, put after the caller's style so it cannot be cancelled. */
const MIRRORED_STYLE = { transform: [{ scaleX: -1 }] } as const;

/**
 * Draws the icon a name stands for at a Stackra size and tone: the app's registry first, then the few icons this
 * package draws itself. A name neither holds draws nothing. Without a
 * `label` it is decorative and hidden from screen readers. Without a `size` or `tone` it takes the holder's.
 */
export function Icon({
  name: iconName,
  size,
  tone,
  label,
  isMirroredInRtl,
  style,
  ...rest
}: IconProps): ReactElement | null {
  const isRtl = useIsRTL();
  // Called on every render, so the hook order is stable; the colour is used only when a tone is given.
  const toneColor = useThemeColor(tone === undefined || tone === "default" ? "foreground" : tone);
  // A cast, not an assignment: the contract's component props leave out `undefined` on purpose (so every Lucide icon
  // is an IconComponent under exactOptionalPropertyTypes), which makes the reverse direction fail to compile. The
  // contract names the props this relies on for accessibility, tone and mirror; only the Svg pass-through is beyond it.
  const found = useIcon(iconName) ?? findIcon(UI_ICONS, iconName);
  if (found === undefined) {
    if (process.env.NODE_ENV !== "production") warnUnknownIcon(iconName, label);
    return null;
  }
  const Drawn = found as ComponentType<Omit<LucideProps, "color"> & { color?: string }>;
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
