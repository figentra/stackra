/**
 * Stackra file contract:
 * Purpose: `speckitPin(miseToml)`, the exact spec-kit version `mise.toml` pins (`"pipx:specify-cli" = "x.y.z"`) (moved from `tools/scripts/doctor.mjs`).
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0027 (CLI tools pinned in mise); ADR 0121 (SDLC tooling roles).
 */

/**
 * The pinned version, or undefined.
 *
 * @param miseToml - the text of mise.toml.
 * @example
 * speckitPin('"pipx:specify-cli" = "1.0.10"\n'); // "1.0.10"
 */
export function speckitPin(miseToml: string): string | undefined {
  return miseToml.match(/^"pipx:specify-cli"\s*=\s*"([^"]+)"/m)?.[1];
}
