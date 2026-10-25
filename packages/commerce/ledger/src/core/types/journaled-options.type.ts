/**
 * Stackra file contract:
 * Purpose: `JournaledOptions`, what the `@Journaled` facet records on an entry model: which of its fields hold the
 *          journal's account, amount, kind, reference, time and currency, and the default balance floor of its accounts.
 * Boundary: a type only. A field left out keeps the journal's own name (`account`, `amount`, `kind`, `reference`,
 *           `at`), except `currency`, which has no default: a model has a currency dimension only when it names the
 *           field, and then every entry, posting and balance names a currency. A model whose fields already carry those
 *           names needs no facet. Field names are the model's TypeScript names; the ORM metadata maps them to columns.
 * Runtime: node
 * Governing contract: ADR 0220 (decision 4); ADR 0294 (decision 6: class facets).
 */

/**
 * The field map and floor of an entry model.
 *
 * @example
 * ```ts
 * @Journaled({ account: "memberId", amount: "points", floor: 0 })
 * export class LedgerEntry extends Model.with(HasPublicId("lpe"), BelongsToTenant, AppendOnly) {}
 * ```
 */
export interface JournaledOptions {
  /** The field holding the account key; `account` by default. */
  readonly account?: string;

  /** The integer field holding the signed amount; `amount` by default. */
  readonly amount?: string;

  /** The field holding why the entry exists; `kind` by default. */
  readonly kind?: string;

  /** The field holding the idempotency reference; `reference` by default. */
  readonly reference?: string;

  /** The field holding when the cause happened; `at` by default. */
  readonly at?: string;

  /**
   * The field holding the entry's ISO 4217 currency code. Absent for a single-unit journal such as points. Present,
   * it makes every entry carry a currency, every posting one currency (else `UnbalancedPostingError`) and every
   * balance a per-currency sum (ADR 0220).
   */
  readonly currency?: string;

  /**
   * The lowest balance a write may leave an account at, unless the call says otherwise; no floor when absent. A
   * points journal declares `0`, so no debit or reversal ever takes a balance negative.
   */
  readonly floor?: number;
}
