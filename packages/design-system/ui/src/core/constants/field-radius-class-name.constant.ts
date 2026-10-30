/**
 * Stackra file contract:
 * Purpose: `FIELD_RADIUS_CLASS_NAME`, the class that gives a native box the theme's field radius (`--radius-field`,
 *          which follows `--field-radius`), so MultiSelect's chip box and InlineEdit's read row match HeroUI Native's
 *          input.
 * Boundary: a class name only; the radius itself is the theme's token.
 * Runtime: react-native
 * Governing contract: ADR 0302 (radius tokens); gap inventory rows 4 and 5.
 */

/** The theme's field radius as a Uniwind class. */
export const FIELD_RADIUS_CLASS_NAME = "rounded-[var(--radius-control)]";
