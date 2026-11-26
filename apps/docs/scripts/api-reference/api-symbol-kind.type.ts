/**
 * Stackra file contract:
 * Purpose: `ApiSymbolKind`, what an exported name of a package entry is.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0007 (docblock standard); STA-2857.
 */

/** What an exported name is. `reexport` is a name another package declares and this entry passes on. */
export type ApiSymbolKind =
  | "class"
  | "function"
  | "interface"
  | "type"
  | "variable"
  | "enum"
  | "namespace"
  | "reexport";
