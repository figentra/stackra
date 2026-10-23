/**
 * Stackra file contract:
 * Purpose: the web `Icon`: draws a Lucide icon (or any component with the same props) at a Stackra size, in a tone's
 *          colour role through the theme's CSS variable, hidden from screen readers unless it has a label, and
 *          mirrored in right-to-left when it points the reading way.
 * Boundary: draws one SVG; no styling layer of its own: the colour is a theme variable, a holder's CSS (HeroUI's
 *          button rules) still sizes and colours it, every other SVG prop passes through.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decisions 3 and 7); ADR 0165 (HeroUI v3 on web; Lucide);
 *          ADR 0060 (RTL).
 */
import type { LucideProps } from "lucide-react";
import { useLocale } from "react-aria-components";
import type { ComponentType } from "react";

import type { IconContractProps } from "#contracts/types/icon-contract-props.type";
import { ICON_SIZES } from "#core/constants/icon-sizes.constant";

/** SVG attributes that reach the drawn icon; the contract's props, colour and accessible name stay the wrapper's. */
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
  | "title"
>;

/**
 * Props of the web Icon: the shared contract plus the SVG attributes lucide-react takes, passed through unchanged.
 * An icon is not a control: for something pressable use a button that holds an icon.
 */
export type IconProps = IconContractProps & IconPassthroughProps;

/**
 * Draws a Lucide icon, or any component with the same props, at a Stackra size and tone. Without a `label` it is
 * decorative and hidden from assistive technology. The mirror is applied after the caller's `style`, so a caller's
 * own `transform` cannot cancel it.
 */
export function Icon({ as, size, tone, label, isMirroredInRtl, style, ...rest }: IconProps) {
  const { direction } = useLocale();
  // A cast, not an assignment: the contract's component props leave out `undefined` on purpose (so every Lucide icon
  // is an IconComponent under exactOptionalPropertyTypes), which makes the reverse direction fail to compile.
  const Drawn = as as ComponentType<LucideProps>;
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
