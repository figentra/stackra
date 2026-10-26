/**
 * Stackra file contract:
 * Purpose: `PromotionDiff`, the reviewed change of one promotable kind from a sandbox to live: the kind, the content
 *          hash of the live snapshot it was computed against and that snapshot itself, the kind's own change rows, and
 *          the minimum platform release the change set needs.
 * Boundary: a type only. The rows are the kind's (settings gives `SettingsChange` rows); the OS shows them and stores
 *           the diff with the promotion record. Applying checks live still hashes to `base` and runs at least
 *           `release`; a rollback re-applies `previous` as a new change set (ADR 0395 decision 2).
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decision 6: change set against a live revision; decision 7: the promotion record;
 *                     decision 8 and open question 6); ADR 0280 (decision 4: reviewed diff); ADR 0395 (decisions 2
 *                     and 3).
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

  /** The live snapshot the diff was computed against (it hashes to `base`), so a rollback can re-apply it. */
  readonly previous: unknown;

  /** The platform release the sandbox ran when the diff was computed; live must run at least this. */
  readonly release?: string;
}
