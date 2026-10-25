/**
 * Stackra file contract:
 * Purpose: the machine codes of what `resolveTheme` and the theme checks find (ADR 0340 decision 2): a layer naming
 *          the wrong parent, a change to a path the policy in force does not allow or locks, a policy that widens the
 *          one above it, a value the theme grammar refuses, a hex that is not its oklch value, a pair under its
 *          contrast minimum, a colour that cannot be measured, and an accent too close to a reserved colour (a notice,
 *          never a refusal).
 * Boundary: the codes only; snake_case, as every machine code (ADR 0231).
 * Runtime: isomorphic
 * Governing contract: ADR 0340 (one token engine); ADR 0140 (machine codes).
 */

/** What a theme check can find. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the codes carry no labels.
export const ThemeFindingCode = Object.freeze([
  "wrong_parent",
  "path_not_allowed",
  "path_locked",
  "policy_widened",
  "invalid_value",
  "hex_drift",
  "contrast_too_low",
  "colour_not_measurable",
  "accent_not_separated",
] as const);

/** One finding code. */
export type ThemeFindingCode = (typeof ThemeFindingCode)[number];
