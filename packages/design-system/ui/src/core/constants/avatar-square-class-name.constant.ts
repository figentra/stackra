/**
 * Stackra file contract:
 * Purpose: the one utility class that turns HeroUI's circular avatar into the rounded square of the `square` shape,
 *          on the root on both runtimes and on the native fallback, whose own radius is 9999.
 * Boundary: a class name only; the radius value comes from the theme's `--radius-lg`. Internal, not in the `.` barrel.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0304; STA-350 owner decision 6 (no second styling layer).
 */

/** The class of a square avatar: Tailwind's `rounded-lg`, the theme's large radius. */
export const AVATAR_SQUARE_CLASS_NAME = "rounded-[var(--radius-control)]";
