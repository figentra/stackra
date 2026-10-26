/**
 * Stackra file contract:
 * Purpose: `REACT_HOOK`, the kind of a React hook file, `use-<name>.ts` beside the component that uses it; test unit.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0129; settlement Q2.2.
 */
import type { KindFolder } from "#node/types/kind-folder.type";

/** React hooks: `use-<name>.ts` beside the component that uses them, or in `ui/` (settlement Q2.2). Test unit. */
export const REACT_HOOK: KindFolder = Object.freeze({
  folder: null,
  suffix: null,
  test: "unit",
  reason: "React hook file, beside its component; the file name starts with use-",
  adr: "0129",
});
