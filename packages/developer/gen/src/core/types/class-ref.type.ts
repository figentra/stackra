/**
 * Stackra file contract:
 * Purpose: `ClassRef`, a class gen refers to from a generated file: its name and the module specifier that file
 *          imports it from.
 * Boundary: a type only. A member's own class is imported through the member's `imports` map (`#node/...`) or by a
 *           relative path; a dependency's class by the specifier its author imported it from (`@acme/loyalty-kit`).
 * Runtime: isomorphic
 * Governing contract: ADR 0261, ADR 0233 (generated code imports through the member's imports map).
 */

/** A class and where to import it from. */
export interface ClassRef {
  /** The exported class name. */
  readonly name: string;

  /** The module specifier. */
  readonly from: string;
}
