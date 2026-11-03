/**
 * Stackra file contract:
 * Purpose: the web `ColorSwatch` on HeroUI v3's ColorSwatch: a preview of one colour, an image named by its `label`
 *          (React Aria's own localised description of the colour when there is none), on HeroUI's checkered ground so
 *          a transparent colour reads as one; every other HeroUI ColorSwatch prop passes through.
 * Boundary: no styling of its own; the look is HeroUI's, themed by `@stackra/tokens`. A colour React Aria cannot parse
 *           (a named colour, `oklch()`, a token's `var()`) is drawn as a plain span in HeroUI's swatch classes, named by
 *           `label` or hidden without one, since there is nothing to describe it by.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract, HeroUI v3 on web); owner decision 6 of STA-350
 *          (thin wrappers); WCAG 2.2 SC 1.1.1 and 1.4.11; STA-1981.
 */
import { ColorSwatch as HeroColorSwatch, cn } from "@heroui/react";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { ColorSwatchProps } from "#react/color-swatch/color-swatch.props";
import { isParsableColor } from "#react/color-swatch/is-parsable-color.function";

/** A preview of one colour. */
export function ColorSwatch({
  color,
  label,
  size = "md",
  shape = "circle",
  className,
  ...rest
}: ColorSwatchProps): ReactElement {
  if (!isParsableColor(color))
    return (
      <span
        {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
        className={
          cn(
            "color-swatch",
            `color-swatch--${shape}`,
            `color-swatch--${size}`,
            typeof className === "string" ? className : undefined,
          ) ?? ""
        }
        style={{ backgroundColor: color }}
      />
    );
  return (
    <HeroColorSwatch
      {...rest}
      {...omitUndefined({ colorName: label, className })}
      color={color}
      size={size}
      shape={shape}
    />
  );
}
