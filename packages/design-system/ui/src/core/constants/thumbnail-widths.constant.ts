/**
 * Stackra file contract:
 * Purpose: `THUMBNAIL_WIDTHS`, a Thumbnail's width in points (CSS pixels on web) for each size: 40, 64 and 96.
 * Boundary: data only; the height follows from the aspect ratio.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same sizes on web and native); design-system gap inventory row 12.
 */

/** The width of each Thumbnail size. */
export const THUMBNAIL_WIDTHS = Object.freeze({ sm: 40, md: 64, lg: 96 } as const);
