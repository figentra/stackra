/**
 * Stackra file contract:
 * Purpose: `AccountingCase`, one recorded case an accounting driver must pass: a mapped journal and its idempotency
 *          key, the provider's recorded calls for posting it twice (the second finds the first) and optionally reading
 *          the chart, the journal the driver must return, and whether the recording is certified against a sandbox.
 * Boundary: a type only. An OS connector ships its cases beside its driver; `certification: "pending"` marks a
 *           recording built from public API documentation (owner D3, 2026-10-27), `"sandbox"` one captured from a
 *           provider sandbox run.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0443 (decisions 7 and 8); STA-794.
 */
import type { AccountingJournalEntry, PostedJournal } from "#contracts/index";
import type { RecordedExchange } from "#testing/accounting/recorded-exchange.type";

/**
 * A recorded accounting case.
 *
 * @example
 * const issued: AccountingCase = { name: "invoice issued", certification: "pending", entry, idempotencyKey: "k1", journal: { providerRef: "J-1", status: "posted" }, exchanges };
 */
export interface AccountingCase {
  /** What the case covers, named in a failure. */
  readonly name: string;

  /** `pending` until the recording is replaced by a sandbox capture. */
  readonly certification: "pending" | "sandbox";

  /** The journal to post, already in the provider's account and tax codes. */
  readonly entry: AccountingJournalEntry;

  /** The key it is posted under, both times. */
  readonly idempotencyKey: string;

  /** The journal the driver must return, both times. */
  readonly journal: PostedJournal;

  /** The chart `accounts()` must return; left out, `accounts()` is not called. */
  readonly accounts?: readonly { readonly code: string; readonly name: string }[];

  /** The calls the driver makes, in order: the first post (find, then post), the second (find), then the chart. */
  readonly exchanges: readonly RecordedExchange[];
}
