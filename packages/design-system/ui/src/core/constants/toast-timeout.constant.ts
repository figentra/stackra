/**
 * Stackra file contract:
 * Purpose: how long, in milliseconds, a plain toast stays: 4000, HeroUI's and HeroUI Native's default. A promise toast
 *          stays this long once it settles.
 * Boundary: data only; the web and native `toast.promise` read it.
 * Runtime: isomorphic
 * Governing contract: ADR 0312 (decisions 1 to 3); WCAG 2.2 SC 2.2.1; STA-1371.
 */

/** The timeout, in milliseconds, of a plain toast. */
export const TOAST_TIMEOUT = 4000;
