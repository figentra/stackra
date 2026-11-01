/**
 * Stackra file contract:
 * Purpose: `missingMiseTools(json)`, the tools `mise ls --current --json` lists as requested but not installed (moved from `tools/scripts/doctor.mjs`).
 * Boundary: pure; parses output it is given.
 * Runtime: node
 * Governing contract: ADR 0027 (CLI tools pinned in mise); ADR 0121 (SDLC tooling roles).
 */

/**
 * The names of the tools with an uninstalled version.
 *
 * @param json - the parsed `mise ls --current --json` output, or null.
 * @example
 * missingMiseTools({ uv: [{ installed: false }] }); // ["uv"]
 */
export function missingMiseTools(
  json: Readonly<Record<string, readonly { readonly installed?: boolean }[]>> | null | undefined,
): string[] {
  return Object.entries(json ?? {})
    .filter(([, versions]) => versions.some((v) => !v.installed))
    .map(([name]) => name);
}
