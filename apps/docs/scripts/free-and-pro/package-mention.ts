/**
 * Stackra file contract:
 * Purpose: `PackageMention`, one package name written in code on a docs page, with the line it is on.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0461; STA-2865.
 */

/** A package named on a page. */
export interface PackageMention {
  /** The package name, without an entry path (`@stackra/builder` for `@stackra/builder/react`). */
  readonly name: string;
  /** The 1-based line the name is on. */
  readonly line: number;
}
