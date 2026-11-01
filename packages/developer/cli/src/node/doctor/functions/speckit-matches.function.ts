/**
 * Stackra file contract:
 * Purpose: `speckitMatches(stdout, pin)`, whether `specify --version` (`specify x.y.z`) equals the mise pin (moved from `tools/scripts/doctor.mjs`).
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0027 (CLI tools pinned in mise); ADR 0121 (SDLC tooling roles).
 */

/**
 * True when the installed spec-kit is the pinned one.
 *
 * @param stdout - the `specify --version` output.
 * @param pin - the pinned version, if any.
 * @example
 * speckitMatches("specify 1.0.10\n", "1.0.10"); // true
 */
export function speckitMatches(stdout: string, pin: string | undefined): boolean {
  return Boolean(pin) && stdout.match(/\bspecify\s+(\S+)/)?.[1] === pin;
}
