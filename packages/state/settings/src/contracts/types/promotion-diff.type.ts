/**
 * Stackra file contract:
 * Purpose: `PromotionDiff`, the reviewed change of one promotable kind from a sandbox to live: the kind, the content
 *          hash of the live snapshot it was computed against, and the kind's own change rows.
 * Boundary: a type only. The rows are the kind's (settings gives `SettingsChange` rows); the OS shows them and stores
 *           the diff with the promotion record. Applying checks live still hashes to `base`.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decision 6: change set against a live revision; decision 7: the promotion record);
 *                     ADR 0280 (decision 4: reviewed diff).
 */

/**
 * One kind's diff.
 *
 * @example
 * const diff = await promotable.diff(live, await promotable.export(sandbox));
 */
export interface PromotionDiff {
  /** The promotable kind (`settings`). */
  readonly kind: string;

  /** The content hash of the live snapshot it was computed against. */
  readonly base: string;

  /** The kind's change rows, empty when live already matches. */
  readonly changes: readonly unknown[];
}
