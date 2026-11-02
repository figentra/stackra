/**
 * Stackra file contract:
 * Purpose: `STACKRA_KINDS`: the kinds of item; a missing `stackra.kind` is `package`.
 * Boundary: a constant only. Mirrors `StackraKind` in `@stackra/skills/contracts`.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 11 and 12); ADR 0511 (contract); ADR 0514 (decision 10, docs).
 */

/** The kinds of item; a missing `stackra.kind` is `package`. */
export const STACKRA_KINDS = [
  "package",
  "skill",
  "agent",
  "mcp",
  "plugin",
  "contract",
  "docs",
] as const;
