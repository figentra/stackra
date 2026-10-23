/**
 * Stackra file contract:
 * Purpose: the badge fills: a solid tone, a neutral fill with toned text, or a soft tint of the tone. HeroUI v3's
 *          Badge and HeroUI Native's Chip both have these three, so a variant reaches either renderer unchanged.
 * Boundary: the values only; each Badge renders them.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API); ADR 0303 (decision 7: props vocabulary); ADR 0304.
 */

/**
 * The badge variants. Verified against `@heroui/styles` 3.2.6 (`badgeVariants.variant`) and `heroui-native` 1.0.10
 * (`ChipVariant`, which adds `tertiary`, left out because the web Badge has none).
 */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the variants carry no labels.
export const BadgeVariant = Object.freeze(["primary", "secondary", "soft"] as const);

/** One badge variant. */
export type BadgeVariant = (typeof BadgeVariant)[number];
