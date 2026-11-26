/**
 * Stackra file contract:
 * Purpose: `SPLIT_AT`, the number of exported names above which a package's reference is split into one page per
 *          entry point.
 * Boundary: a constant only. At 500 names a page is about 2.5 MB of prerendered HTML; @stackra/ui (2,152 names) on one
 *           page was 12.6 MB.
 * Runtime: node
 * Governing contract: STA-2857.
 */

/** A package with more exported names than this gets one reference page per entry point besides `.`. */
export const SPLIT_AT = 500;
