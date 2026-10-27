/**
 * Stackra file contract:
 * Purpose: `MemoryAccountingConnector`, the memory driver of `AccountingProvider` and `AccountMapped`: a chart, a
 *          mapping and journals held in this process with the contract's rules (balanced, one journal per idempotency
 *          key, `find` by key), so a journal export runs end to end in a test or a local host with no provider.
 * Boundary: a plain class implementing the contracts, not a Connection: no credential and no provider call. A line on
 *           an account outside its chart is refused as a provider refuses one (`unknown_account`), so a caller's
 *           refusal path is testable. Journals are `mj_<n>`; `drafts` holds them as drafts; `posted` lists what
 *           arrived, oldest first. Names no vendor (ADR 0443 decision 8).
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (decision 2: a memory driver per capability); ADR 0269 (decision 3); STA-794.
 */
import type {
  AccountMap,
  AccountMapped,
  AccountingProvider,
  JournalEntry,
  PostedJournal,
} from "#contracts/index";
import { assertBalanced, ProviderRefusedError } from "#core/index";

/** The options of a memory accounting connector. */
interface MemoryAccountingOptions {
  /** The provider's chart; empty accepts any account code. */
  readonly chart?: readonly { readonly code: string; readonly name: string }[];

  /** The tenant's mapping on this Connection. */
  readonly accountMap?: AccountMap;

  /** Holds journals as drafts awaiting approval, as some providers do. */
  readonly drafts?: boolean;
}

/**
 * Journals in memory.
 *
 * @example
 * const accounting = new MemoryAccountingConnector({ chart: [{ code: "1100", name: "Receivables" }] });
 * await postMappedJournal(accounting, entry, "invoice.issued:evt_1");
 */
export class MemoryAccountingConnector implements AccountingProvider, AccountMapped {
  /** Every journal posted, oldest first. */
  readonly posted: JournalEntry[] = [];

  /** Idempotency key to journal. */
  private readonly journals = new Map<string, PostedJournal>();

  /** The options it was built with. */
  private readonly options: MemoryAccountingOptions;

  /**
   * @param options - the chart, the mapping and whether journals are drafts.
   */
  constructor(options: MemoryAccountingOptions = {}) {
    this.options = options;
  }

  /** Posts `entry` once per `idempotencyKey`, refusing an account outside the chart. */
  async post(entry: JournalEntry, idempotencyKey: string): Promise<PostedJournal> {
    const existing = this.journals.get(idempotencyKey);
    if (existing !== undefined) return existing;
    assertBalanced(entry);
    const chart = this.options.chart ?? [];
    if (
      chart.length > 0 &&
      entry.lines.some((line) => !chart.some((account) => account.code === line.account))
    )
      throw ProviderRefusedError.create({
        provider: "memory",
        status: 422,
        code: "unknown_account",
      });
    const journal: PostedJournal = Object.freeze({
      providerRef: `mj_${this.journals.size + 1}`,
      status: this.options.drafts === true ? "draft" : "posted",
    });
    this.posted.push(entry);
    this.journals.set(idempotencyKey, journal);
    return journal;
  }

  /** The journal posted under `idempotencyKey`, or `null`. */
  async find(idempotencyKey: string): Promise<PostedJournal | null> {
    return this.journals.get(idempotencyKey) ?? null;
  }

  /** The chart. */
  async accounts(): Promise<readonly { readonly code: string; readonly name: string }[]> {
    return this.options.chart ?? [];
  }

  /** The mapping; empty when none was given. */
  async accountMap(): Promise<AccountMap> {
    return this.options.accountMap ?? { accounts: {} };
  }
}
