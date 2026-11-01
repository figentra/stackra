/**
 * Stackra file contract:
 * Purpose: `infisicalLoggedIn(text)`, whether `infisical profile list` shows a usable login: one row per login, a usable one with SESSION `active` (moved from `tools/scripts/doctor.mjs`).
 * Boundary: pure; the output is parsed, never printed.
 * Runtime: node
 * Governing contract: ADR 0027 (CLI tools pinned in mise); ADR 0121 (SDLC tooling roles).
 */

/**
 * True when a login row is active.
 *
 * @param text - the `infisical profile list` output.
 * @example
 * infisicalLoggedIn("* me@x.com active"); // true
 */
export function infisicalLoggedIn(text: string): boolean {
  return /\bactive\b/.test(text);
}
