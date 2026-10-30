/**
 * Stackra file contract:
 * Purpose: `DISPLAY_FOOTER`, the classes of a Display popover's footer row (the shell's and the Theme Studio's): a
 *          hairline over a row of outline buttons sharing its width, so both popovers end the same way.
 * Boundary: classes only.
 * Runtime: browser
 * Governing contract: STA-1371 (owner, 2026-10-29: the studio's Display popover matches the home one).
 */

/** The footer row of a Display popover. */
export const DISPLAY_FOOTER = "flex gap-2 border-t border-separator pt-4 [&>*]:flex-1";
