/**
 * Stackra file contract:
 * Purpose: `CONSTITUTION_PATHS`: where the docs laws live (`source`, one `.mdx` per law, `index.mdx` first) and the
 *          one file Figentra Flow's `flow-*` commands read (`output`, `.flow/constitution.md`, ADR 0510).
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0510; STA-2098 (H6: moved from core's agents-sync script).
 */

/** The constitution's sources and its rendered file, repository-relative. */
export const CONSTITUTION_PATHS = Object.freeze({
  source: "apps/docs/src/docs/constitution",
  output: ".flow/constitution.md",
});
