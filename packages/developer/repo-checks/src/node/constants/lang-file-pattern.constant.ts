/**
 * Stackra file contract:
 * Purpose: `LANG_FILE_PATTERN`, a lang file path: the member root, the locale folder and the namespace.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0305 (rule 1: `assets/lang/<locale>/<namespace>.json`); ADR 0403.
 */

/** A lang file: the member root, the locale folder and the namespace. */
export const LANG_FILE_PATTERN = /^(.+)\/assets\/lang\/([^/]+)\/([^/]+)\.json$/;
