/**
 * Stackra file contract:
 * Purpose: the web `Icon`: draws an icon by name, resolved through the `@stackra/icons` registry, at a Stackra size,
 *          in a tone's colour role through the theme's CSS variable, hidden from screen readers unless it has a label, and
 *          mirrored in right-to-left when it points the reading way.
 * Boundary: draws one SVG, or nothing for a name no registry holds; no styling layer of its own: the colour is a theme variable, a holder's CSS (HeroUI's
 *          button rules) still sizes and colours it, every other SVG prop passes through.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decisions 3 and 7); ADR 0165 (HeroUI v3 on web; Lucide);
 *          ADR 0060 (RTL); ADR 0303 (decision 10).
 */
import { findIcon } from "@stackra/icons";
import { useIcon } from "@stackra/icons/react";
import type { LucideProps } from "lucide-react";
import { useLocale } from "react-aria-components";
import type { ComponentType } from "react";

import { ICON_SIZES } from "#core/constants/icon-sizes.constant";
import { warnUnknownIcon } from "#core/functions/warn-unknown-icon.function";
import { UI_ICONS } from "#react/icon/ui-icons.constant";
import type { IconProps } from "#react/icon/icon.props";

/**
 * Draws the icon a name stands for at a Stackra size and tone: the app's registry first, then the few icons this
 * package draws itself. A name neither holds draws nothing. Without a `label` it is
 * decorative and hidden from assistive technology. The mirror is applied after the caller's `style`, so a caller's
 * own `transform` cannot cancel it.
 */
export function Icon({
  name: iconName,
  size,
  tone,
  label,
  isMirroredInRtl,
  style,
  ...rest
}: IconProps) {
  const { direction } = useLocale();
  // A cast, not an assignment: the contract's component props leave out `undefined` on purpose (so every Lucide icon
  // is an IconComponent under exactOptionalPropertyTypes), which makes the reverse direction fail to compile. The
  // contract names the props this relies on for accessibility, tone and mirror; only the SVG pass-through is beyond it.
  const found = useIcon(iconName) ?? findIcon(UI_ICONS, iconName);
  if (found === undefined) {
    if (process.env.NODE_ENV !== "production") warnUnknownIcon(iconName, label);
    return null;
  }
  const Drawn = found as ComponentType<LucideProps>;
  const isMirrored = isMirroredInRtl === true && direction === "rtl";
  const colour = tone ? { color: `var(--${tone === "default" ? "foreground" : tone})` } : {};
  // Set explicitly: the `aria-hidden` Lucide adds by itself is not relied on, the tests pin this one.
  const name = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };

  return (
    <Drawn
      size={ICON_SIZES[size ?? "md"]}
      {...rest}
      {...name}
      style={{ ...style, ...colour, ...(isMirrored ? { transform: "scaleX(-1)" } : {}) }}
    />
  );
}
