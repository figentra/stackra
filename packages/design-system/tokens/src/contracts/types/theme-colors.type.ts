/**
 * Stackra file contract:
 * Purpose: `ThemeColors`, part of the token schema of the Stackra Design System (see `Theme`): a colour for every
 *          semantic role; HeroUI components read these.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0231 (design tokens: CSS property form).
 */
import type { ColorRole } from "#contracts/enums/color-role.enum";
import type { ColorToken } from "#contracts/types/color-token.type";

/** A colour for every semantic role; HeroUI components read these. */
export type ThemeColors = { readonly [Role in ColorRole]: ColorToken };
