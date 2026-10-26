/**
 * Stackra file contract:
 * Purpose: `EXPLORER`, where a package that ships decorators registers them: an Explorer in the entry that exports them.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15).
 */

/** A package that ships decorators registers them through an Explorer in the entry that exports them (ADR 0294 d15). */
export const EXPLORER = Object.freeze({
  file: "src/<entry>/<pkg>.explorer.ts",
  suffix: "explorer",
  reason: "only in a package that ships decorators, which it registers",
  adr: "0294 d15",
});
