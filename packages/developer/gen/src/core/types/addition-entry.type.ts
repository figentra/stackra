/**
 * Stackra file contract:
 * Purpose: `AdditionEntry`, one row of a manifest's `additions` section: a model addition's key, class and file, the
 *          base model key and the package it is released from, its side table, the wire key its fields nest under,
 *          and its field names.
 * Boundary: a type only; `additionsOf` builds it and reads other members' rows back from their manifests. The
 *           manifest's open sections carry it, so `StackraManifest` needs no new field.
 * Runtime: isomorphic
 * Governing contract: ADR 0336 (decisions 2, 3 and 6).
 */

/** One model addition, as the manifest lists it. */
export interface AdditionEntry {
  /** The addition's key, `<module>.<snake class>`. */
  readonly key: string;

  /** The addition class. */
  readonly class: string;

  /** Its source file, relative to the member root. */
  readonly file: string;

  /** The base model's key, from the base's released manifest. */
  readonly base: string;

  /** The package the base model is imported from. */
  readonly from: string;

  /** The side table, schema-qualified in the addition's module. */
  readonly table: string;

  /** The key the fields nest under on the base's wire shape: the addition's module key. */
  readonly wire: string;

  /** The addition's field names, in source order. */
  readonly fields: readonly string[];
}
