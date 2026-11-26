/**
 * Stackra file contract:
 * Purpose: `LAYOUT_TEMPLATES`, the root entries each Flow preset's template holds (`neutral`: figentra/neutral-template,
 *          `stackra`: figentra/stackra-template), which the layout check allows without a declaration.
 * Boundary: data only; `checkRepositoryLayout` reads it.
 * Runtime: node
 * Governing contract: ADR 0526 (decision 4); ADR 0528 (decision 1).
 */

/**
 * What every template holds: the shared layout, the agent surfaces `fflow sync` renders for every preset
 * (`.mcp.yaml`, OpenCode's config and plugins) and the files a pnpm workspace needs (ADR 0528 d1).
 */
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
  ".mcp.yaml",
  ".node-version",
  ".npmrc",
  ".opencode",
  ".oxfmtrc.jsonc",
  ".oxlintrc.jsonc",
  ".pnpmfile.mjs",
  "AGENTS.md",
  "CLAUDE.md",
  "CONTRIBUTING.md",
  "LICENSE",
  "README.md",
  "SECURITY.md",
  // The repo's current state and its agent index (master plan 2026-11-07, Phase 0 steps 1 and 8).
  "STATE.md",
  "cspell.config.yaml",
  "docs",
  "flow.config.json",
  "knip.jsonc",
  "llms.txt",
  "lefthook.yml",
  "mise.toml",
  "opencode.jsonc",
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
/** The stackra template's root, named by the bundled preset and by its package (`@stackra/flow-preset`, T142). */
const STACKRA = Object.freeze([
  ...NEUTRAL,
  ".easignore",
  ".markdownlint.yaml",
  ".testbed",
  ".vscode",
  "NOTICE",
  "assets",
  "brand.json",
  "runway.yaml",
  "stackra.lock.yaml",
]);

/** The root entries of each preset's template, by preset id and preset package name. */
export const LAYOUT_TEMPLATES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  neutral: Object.freeze(NEUTRAL),
  stackra: STACKRA,
  "@stackra/flow-preset": STACKRA,
});
