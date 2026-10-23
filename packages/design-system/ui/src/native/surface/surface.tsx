/**
 * Stackra file contract:
 * Purpose: the native `Surface` on HeroUI Native's Surface: the same levels as web, with HeroUI Native's padding,
 *          radius and surface shadow; `animation`, `asChild` and the theme `background` layer pass through.
 * Boundary: no styling of its own. Unlike the web surface, HeroUI Native's is a padded, rounded, ringed box; a
 *          chrome-free one is a call-site `className="p-0 rounded-none shadow-none"`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI Native on native); ADR 0304; owner decision 6 of STA-350
 *          (thin wrappers).
 */
import { Surface as HeroSurface } from "heroui-native";
import type { ComponentPropsWithRef } from "react";

import type { SurfaceContractProps } from "#contracts/types/surface-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of the native Surface: the shared contract plus HeroUI Native's own surface props, passed through unchanged. */
export type SurfaceProps = SurfaceContractProps &
  Omit<ComponentPropsWithRef<typeof HeroSurface>, keyof SurfaceContractProps>;

/**
 * A background at one of the theme's surface levels. HeroUI Native keeps the level in its surface context, so HeroUI
 * components inside pick colours that sit on it. The native surface draws padding, radius and the surface shadow.
 */
export function Surface({ variant, ...rest }: SurfaceProps) {
  return <HeroSurface {...rest} {...omitUndefined({ variant })} />;
}
