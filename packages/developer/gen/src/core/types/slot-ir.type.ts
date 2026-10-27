/**
 * Stackra file contract:
 * Purpose: `SlotIR`, one shell slot discovery read from an exported `defineSlot<Props>({ key, surface, cardinality })`:
 *          its const name, file and import path, its options and its props record.
 * Boundary: a type only. `props` maps each prop name (with `?` when optional) to its type text as the checker prints
 *           it, sorted by name: the record the manifest's `slots` carry and `checkSlotFills` compares.
 * Runtime: isomorphic
 * Governing contract: ADR 0438 (slots, not shadowing); app-shells-edge-and-extension.md 7.2 and 12.2.1.
 */

/** A slot a member declares. */
export interface SlotIR {
  /** The exported const name (`SignInBrandPanel`). */
  readonly name: string;

  /** The file, relative to the member root. */
  readonly file: string;

  /** Where a generated file or a fill in the same member imports it from (`#core/slots/sign-in-brand-panel.slot`). */
  readonly importPath: string;

  /** The snake_case dotted key. */
  readonly key: string;

  /** The surface code. */
  readonly surface: string;

  /** `one` or `many`. */
  readonly cardinality: string;

  /** Prop name (`name?` when optional) to its type text. */
  readonly props: Readonly<Record<string, string>>;
}
