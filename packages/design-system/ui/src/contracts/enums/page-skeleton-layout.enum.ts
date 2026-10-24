/**
 * Stackra file contract:
 * Purpose: the layouts a `PageSkeleton` draws placeholders for: a whole `page` (header and two blocks), a `table` (a
 *          toolbar, a header row and rows), a `section` (a heading, text and a block) and a `form` (labelled fields
 *          and a button row).
 * Boundary: the values only; the bones of each layout are `PAGE_SKELETON_ROWS`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0313 (decision 6).
 */

/** The skeleton layouts, `page` first. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the layouts carry no labels.
export const PageSkeletonLayout = Object.freeze(["page", "table", "section", "form"] as const);

/** One skeleton layout. */
export type PageSkeletonLayout = (typeof PageSkeletonLayout)[number];
