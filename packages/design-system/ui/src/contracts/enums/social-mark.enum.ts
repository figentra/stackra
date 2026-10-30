/**
 * Stackra file contract:
 * Purpose: the sign-in providers whose mark @stackra/ui draws by itself in SocialSignInButtons.
 * Boundary: the values only; the drawings are `SOCIAL_MARKS` in core.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); wave 3c mobile interactions (owner approval 2026-10-28).
 */

/** The providers with a built-in mark. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the values carry no labels.
export const SocialMark = Object.freeze([
  "apple",
  "google",
  "microsoft",
  "x",
  "facebook",
  "email",
] as const);

/** One provider with a built-in mark. */
export type SocialMark = (typeof SocialMark)[number];
