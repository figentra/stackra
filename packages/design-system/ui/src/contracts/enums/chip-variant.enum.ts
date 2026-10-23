/**
 * Stackra file contract:
 * Purpose: the chip variants: the three shared emphasis levels plus `soft`, the tinted background HeroUI adds for
 *          chips. The list is the same on HeroUI v3 and HeroUI Native, so a variant reaches both renderers unchanged.
 * Boundary: the values only; each Chip renders them.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API); ADR 0165 (UI contract); ADR 0303 (decision 7: props
 *          vocabulary); ADR 0304.
 */
import { Variant } from "#contracts/enums/variant.enum";

/**
 * The chip variants. Verified against `@heroui/styles` 3.2.6 (`chipVariants.variant`) and `heroui-native` 1.0.10
 * (`ChipVariant`): the same four on both.
 */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the variants carry no labels.
export const ChipVariant = Object.freeze([...Variant, "soft"] as const);

/** One chip variant. */
export type ChipVariant = (typeof ChipVariant)[number];
