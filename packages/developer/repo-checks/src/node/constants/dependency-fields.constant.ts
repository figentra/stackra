/**
 * Stackra file contract:
 * Purpose: `DEPENDENCY_FIELDS`, the `package.json` fields that name dependencies, in the order the checks read them.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0019 (catalog versions only).
 */

/** The `package.json` dependency fields a member check walks. */
export const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
] as const;
