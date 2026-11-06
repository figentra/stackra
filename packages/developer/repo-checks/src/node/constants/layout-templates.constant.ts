/**
 * Stackra file contract:
 * Purpose: `LAYOUT_TEMPLATES`, the root entries each Flow preset's template holds (`neutral`: figentra/neutral-template,
 *          `stackra`: figentra/stackra-template), which the layout check allows without a declaration.
 * Boundary: data only; `checkRepositoryLayout` reads it.
 * Runtime: node
 * Governing contract: ADR 0526 (decision 4); ADR 0528 (decision 1).
 */

/** What every template holds: the shared layout plus the files a pnpm workspace needs (ADR 0528 d1). */
const NEUTRAL = [
  ".agents",
  ".changeset",
  ".claude",
  ".commitlintrc.yaml",
  ".editorconfig",
  ".flow",
  ".gitattributes",
  ".github",
  ".gitignore",
  ".gitleaks.toml",
  ".gitleaksignore",
  ".node-version",
  ".npmrc",
  ".oxfmtrc.jsonc",
  ".oxlintrc.jsonc",
  ".pnpmfile.mjs",
  "AGENTS.md",
  "CLAUDE.md",
  "CONTRIBUTING.md",
  "LICENSE",
  "README.md",
  "SECURITY.md",
  "cspell.config.yaml",
  "docs",
  "flow.config.json",
  "knip.jsonc",
  "lefthook.yml",
  "mise.toml",
  "osv-scanner.toml",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "renovate.json5",
  "turbo.jsonc",
];

/**
 * Root entries per preset. A member folder (from `pnpm-workspace.yaml`), `tools/` with its README and the
 * entries a repository declares in its package.json `stackra.layout.allow` are added per repository.
 */
export const LAYOUT_TEMPLATES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  neutral: Object.freeze(NEUTRAL),
  stackra: Object.freeze([
    ...NEUTRAL,
    ".easignore",
    ".markdownlint.yaml",
    ".mcp.yaml",
    ".testbed",
    ".vscode",
    "NOTICE",
    "assets",
    "brand.json",
    "runway.yaml",
    "stackra.lock.yaml",
  ]),
});
