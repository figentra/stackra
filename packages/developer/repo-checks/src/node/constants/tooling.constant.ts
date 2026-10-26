/**
 * Stackra file contract:
 * Purpose: `TOOLING`, the tooling preset group: `packages/tooling/<name>` with `tier:config`, not a package category.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0003.
 */

/** Tooling presets sit under `packages/tooling/<name>` and carry tier:config, not a package category (ADR 0003). */
export const TOOLING = Object.freeze({
  name: "tooling",
  tier: "tier:config",
  reason: "build, lint and test presets with no workspace dependencies",
  adr: "0003",
});
