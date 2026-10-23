/**
 * Stackra file contract:
 * Purpose: the web `Surface` on HeroUI v3's Surface: a background at one of the theme's surface levels, whose level
 *          HeroUI components inside read through `SurfaceContext`; every HeroUI prop passes through.
 * Boundary: no styling of its own; padding and radius are the caller's classes, as HeroUI's web surface has none.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI v3 on web); ADR 0304; owner decision 6 of STA-350
 *          (thin wrappers).
 */
import { Surface as HeroSurface, type SurfaceRootProps } from "@heroui/react";
import type { ComponentPropsWithRef } from "react";

import type { SurfaceContractProps } from "#contracts/types/surface-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/**
 * HeroUI's props for a `div` surface: its own props plus the `div` attributes, as its generic signature spreads them.
 * HeroUI's exported `SurfaceProps` alone leaves the attributes out, so `id`, `role` and `ref` would be refused.
 */
type HeroSurfaceProps = SurfaceRootProps<"div"> &
  Omit<ComponentPropsWithRef<"div">, keyof SurfaceRootProps<"div">>;

/** Props of the web Surface: the shared contract plus HeroUI v3's own surface props, passed through unchanged. */
export type SurfaceProps = SurfaceContractProps &
  Omit<HeroSurfaceProps, keyof SurfaceContractProps>;

/**
 * A background at one of the theme's surface levels. HeroUI keeps the level in `SurfaceContext`, so HeroUI fields
 * inside pick colours that sit on it. The web surface paints colour only: add padding and radius with `className`.
 */
export function Surface({ variant, ...rest }: SurfaceProps) {
  return <HeroSurface {...rest} {...omitUndefined({ variant })} />;
}
