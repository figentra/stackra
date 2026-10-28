/**
 * Stackra file contract:
 * Purpose: `ChangeCapture`, what `changeCaptureOf` answers for a model that captures its changes: whether values are
 *          carried, and every field whose value is dropped from a change.
 * Boundary: a type only. `dropped` already joins the trait's `exclude`, the `HasEncryptedFields` fields and every
 *           `@Classified` field (the ones erasure reaches), so a reader never filters again.
 * Runtime: isomorphic
 * Governing contract: data-layer gaps cdc1 and cdc2; ADR 0096 (decision 4: encrypted fields); ADR 0134 (erasure).
 */

/** The change capture of one model. */
export interface ChangeCapture {
  /** Whether changes carry `before` and `after` values. */
  readonly values: boolean;

  /** The fields whose values never enter a change. */
  readonly dropped: ReadonlySet<string>;
}
