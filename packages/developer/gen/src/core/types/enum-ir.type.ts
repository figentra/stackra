/**
 * Stackra file contract:
 * Purpose: `EnumIR`, one `Enum.of({...})` the member declares, with its codes in source order, so gen emits its `X$`
 *          and its JSON Schema once and every field of that type refers to it.
 * Boundary: a type only. The codes come from the declaration's syntax, never from the checker, which drops the enum
 *           alias and sorts the union (the STA-335 spike).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 26: enums from the declared type node in source order).
 */

/** One member enum. */
export interface EnumIR {
  /** The enum's name. */
  readonly name: string;

  /** The module key. */
  readonly module: string;

  /** The source file, relative to the member root. */
  readonly file: string;

  /** The codes, in source order. */
  readonly values: readonly string[];
}
