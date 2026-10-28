/**
 * Stackra file contract:
 * Purpose: the web `Surface` on HeroUI v3's Surface: a background at one of the theme's surface levels, whose level
 *          HeroUI components inside read through `SurfaceContext`; every HeroUI prop passes through.
 * Boundary: no styling of its own; padding and radius are the caller's classes, as HeroUI's web surface has none.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI v3 on web); ADR 0304; owner decision 6 of STA-350
 *          (thin wrappers).
 */
import type { ReactElement } from "react";
import { Surface as HeroSurface } from "@heroui/react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { SurfaceProps } from "#react/surface/surface.props";

/**
 * A background at one of the theme's surface levels. HeroUI keeps the level in `SurfaceContext`, so HeroUI fields
 * inside pick colours that sit on it. The web surface paints colour only: add padding and radius with `className`.
 */
export function Surface({ variant, ...rest }: SurfaceProps): ReactElement {
  return <HeroSurface {...rest} {...omitUndefined({ variant })} />;
}
