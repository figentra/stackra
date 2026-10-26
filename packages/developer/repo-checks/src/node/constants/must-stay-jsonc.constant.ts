/**
 * Stackra file contract:
 * Purpose: `MUST_STAY_JSONC`, the JSONC files whose reader has no YAML support, each with the reader. Repo-owned config is
 *          YAML; a .jsonc is allowed only where the tool cannot read YAML.
 * Boundary: data only; a new entry names the reader.
 * Runtime: node
 * Governing contract: the YAML standard (STA-299); ADR 0284 (Wrangler).
 */

/**
 * JSONC files whose reader has no YAML support, each with the reader. Repo-owned config (read by tools/scripts)
 * is YAML; a .jsonc is allowed only where the tool cannot read YAML. A new entry names the reader.
 */
export const MUST_STAY_JSONC: readonly (readonly [RegExp, string])[] = [
  [/(^|\/)turbo\.jsonc$/, "Turborepo: turbo.json / turbo.jsonc only"],
  [
    /^\.oxlintrc\.jsonc$|^packages\/tooling\/oxlint\/src\/[\w-]+\.jsonc$/,
    "oxlint: JSON/JSONC or oxlint.config.ts",
  ],
  [/^\.oxfmtrc\.jsonc$/, "oxfmt: .oxfmtrc.json / .jsonc only"],
  [/^knip\.jsonc$/, "knip: JSON/JSONC or knip.ts"],
  [/^opencode\.jsonc$/, "OpenCode: opencode.json / .jsonc only"],
  [/(^|\/)wrangler\.jsonc$/, "Wrangler: wrangler.toml / .json / .jsonc only (ADR 0284)"],
];
