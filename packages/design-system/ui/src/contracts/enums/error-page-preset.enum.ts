/**
 * Stackra file contract:
 * Purpose: the full-page failures an `ErrorPage` has ready-made words and an icon for: `forbidden` (HTTP 403),
 *          `not-found` (404), `server-error` (500 and the other 5xx) and `offline` (no network).
 * Boundary: the values only; each maps to an `ErrorKind` of `ErrorState` in `ERROR_PAGE_PRESET`. Signing in (401)
 *           is not a preset: the app redirects, or renders `ErrorState` with the kind `unauthenticated`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0313 (decision 6); GAPS.md row 31 (owner decision 2026-10-28).
 */

/** The presets, by HTTP status, offline last. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the words live in `ui.json`.
export const ErrorPagePreset = Object.freeze([
  "forbidden",
  "not-found",
  "server-error",
  "offline",
] as const);

/** One ready-made error page by name. */
export type ErrorPagePreset = (typeof ErrorPagePreset)[number];
