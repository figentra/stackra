/**
 * Stackra file contract:
 * Purpose: the avatar shapes: `circle` for people (HeroUI's only shape) and `square`, rounded corners, for
 *          organisations, teams and other non-person records.
 * Boundary: the values only; each Avatar renders them.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0304.
 */

/** The avatar shapes. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the shapes carry no labels.
export const AvatarShape = Object.freeze(["circle", "square"] as const);

/** One avatar shape. */
export type AvatarShape = (typeof AvatarShape)[number];
