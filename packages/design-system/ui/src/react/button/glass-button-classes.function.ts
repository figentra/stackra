/**
 * Stackra file contract:
 * Purpose: `glassButtonClasses(variant, size?)`: HeroUI's button classes for any `ButtonVariant`, the `glass` one
 *          included: HeroUI has no glass variant, so it is HeroUI's ghost plus `button--glass`, which the material
 *          layer of `@stackra/tokens` draws (ADR 0320 as amended 2026-10-31). Every web part that styles a link or a
 *          trigger as a button reads it, so a glass action looks the same everywhere.
 * Boundary: classes only.
 * Runtime: browser
 * Governing contract: ADR 0320 (as amended 2026-10-31); ADR 0165 (HeroUI v3 on web).
 */
import { buttonVariants, cn } from "@heroui/react";

import type { ButtonVariant } from "#contracts/enums/button-variant.enum";
import type { Size } from "#contracts/enums/size.enum";
import { heroButtonVariant } from "#react/button/hero-button-variant.function";

/** HeroUI's button classes for `variant` and `size`, glass drawn as ghost plus `button--glass`. */
export function glassButtonClasses(variant: ButtonVariant, size?: Size): string {
  const look = buttonVariants({
    variant: heroButtonVariant(variant),
    ...(size === undefined ? {} : { size }),
  });
  if (variant === "glass") return cn(look, "button--glass") ?? look;
  return variant === "core" ? (cn(look, "button--core") ?? look) : look;
}
