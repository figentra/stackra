/**
 * Stackra file contract:
 * Purpose: `CapturesChangesOptions`, what `CapturesChanges({...})` takes: whether each change of the model's rows
 *          carries the written fields' values before and after, and which fields never carry a value.
 * Boundary: a type only, read by @stackra/outbox's flush writer through `changeCaptureOf`. Field names are the model
 *           author's configuration, never computed; encrypted and `@Classified` fields are dropped without being named.
 * Runtime: isomorphic
 * Governing contract: data-layer gaps cdc1 and cdc2; ADR 0078 and ADR 0221 (2026-10-28 amendment: the change feed).
 */

/** The change capture of a model. */
export interface CapturesChangesOptions {
  /** Whether a change carries `before` and `after` values of the written fields; field names only when absent. */
  readonly values?: boolean;

  /** Fields whose values never enter a change, on top of the encrypted and `@Classified` ones. */
  readonly exclude?: readonly string[];
}
