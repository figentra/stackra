/**
 * Stackra file contract:
 * Purpose: the avatar variants: `default` (a neutral disc behind the fallback) and `soft` (the tone's soft colour
 *          behind it). The list is the same on HeroUI v3 and HeroUI Native, so a variant reaches both unchanged.
 * Boundary: the values only; each Avatar renders them.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API); ADR 0303 (decision 7: props vocabulary); ADR 0304.
 */

/** The avatar variants. Verified against `@heroui/styles` 3.2.6 and `heroui-native` 1.0.10 (`AvatarVariant`). */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the variants carry no labels.
export const AvatarVariant = Object.freeze(["default", "soft"] as const);

/** One avatar variant. */
export type AvatarVariant = (typeof AvatarVariant)[number];
