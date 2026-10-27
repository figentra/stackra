/**
 * Stackra file contract:
 * Purpose: `Journal<M>`, the double-entry arithmetic every ledger shares, over one append-only entry model: append once
 *          per (account, reference), the balance as the sum of an account's entries, a debit refused below a balance
 *          floor, set-based reversal cut at the floor, balanced multi-line postings, and a posting's lines read back by
 *          reference. A model that names a currency field has every entry and posting in one ISO
 *          4217 currency and every balance per currency (ADR 0220).
 * Boundary: a service over the model's repository; it writes no SQL. Rows are inserted, never updated: the model must
 *           carry `AppendOnly`, and a correction is a reversal. Every write that lowers a balance holds its account's
 *           lock from `Locks` (a transaction-level advisory lock on Postgres, so it lasts until the caller commits), so
 *           concurrent debits of one account serialise and each sees the one before; a write that only raises a
 *           balance takes none. Everything runs in the caller's transaction and scope session, so the row-level
 *           security of the model's table applies and the journal adds no scope filter of its own. The idempotency key
 *           is the model's unique index over its scope column, account and reference, which the model declares. The
 *           model comes from `journalOf(Model)`, the token gen wires for a `Journal<Model>` parameter; the platform
 *           name keeps no `Service` suffix (as `Locks` and `GraphQuery`).
 * Runtime: node
 * Governing contract: ADR 0220 (decisions 4 and 5); ADR 0149 (decisions 1 and 2); ADR 0097 (decision 5.3); ADR 0294
 *                     (decisions 16, 17 and 25); ADR 0305 (rule 5: partner by type argument); STA-1240 (lines by
 *                     reference).
 */
import { Service } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { SortDirection } from "@stackra/contracts";
import { repositoryOf, UniqueViolation } from "@stackra/database";
import type { Repository } from "@stackra/database";
import type { Where } from "@stackra/database/contracts";
import type { Locks } from "@stackra/locking";
import { traitsOf } from "@stackra/model";

import { JOURNAL_FIELDS } from "#node/constants/journal-fields.constant";
import { JOURNAL_LOCK_TTL } from "#node/constants/journal-lock-ttl.constant";
import { Journaled } from "#core/decorators/journaled.decorator";
import { UnbalancedPostingError } from "#core/errors/unbalanced-posting.error";
import type { JournalEntry } from "#core/types/journal-entry.type";
import type { JournalLine } from "#core/types/journal-line.type";
import type { JournalWrite } from "#core/types/journal-write.type";

/** The model's field of each journal name, and its default floor. */
type Fields = Readonly<Record<keyof typeof JOURNAL_FIELDS, string>> & {
  readonly floor?: number | undefined;
  readonly currency?: string | undefined;
};

/** The shape of an ISO 4217 alphabetic code. */
const CURRENCY_CODE = /^[A-Z]{3}$/;

/** Written now. */
const WRITTEN: JournalWrite = Object.freeze({ written: true, belowFloor: false });

/** Not written: the reference was already applied. */
const NOT_WRITTEN: JournalWrite = Object.freeze({ written: false, belowFloor: false });

/** Not written: a balance would have gone below its floor. */
const BELOW_FLOOR: JournalWrite = Object.freeze({ written: false, belowFloor: true });

/** Refuses an amount that is not a whole number of units, so a float never reaches a ledger (ADR 0220). */
function assertAmount(amount: number): void {
  if (!Number.isSafeInteger(amount))
    throw new RangeError(
      `A journal amount is a safe integer of points or minor units, not ${amount}`,
    );
}

/**
 * The currency an entry is written in: its own when the model has a currency field, undefined when it has none.
 *
 * @throws RangeError when the model has a currency field and the entry's currency is not an ISO 4217 code.
 * @throws TypeError when the entry names a currency the model has no field for.
 */
function currencyOf(entry: { readonly currency?: string }, fields: Fields): string | undefined {
  if (fields.currency === undefined) {
    if (entry.currency !== undefined)
      throw new TypeError(
        "A journal entry names a currency, but its model's @Journaled has no currency field",
      );
    return undefined;
  }
  if (entry.currency === undefined || !CURRENCY_CODE.test(entry.currency))
    throw new RangeError(`A journal entry names an ISO 4217 currency code, not ${entry.currency}`);
  return entry.currency;
}

/** The floor a write keeps: the call's (`null` lifts it), else the model's default; undefined for none. */
function floorOf(option: number | null | undefined, fields: Fields): number | undefined {
  return option === null ? undefined : (option ?? fields.floor);
}

/** A filter of the model under its own field names. */
function whereOf<M extends object>(filter: Record<string, unknown>): Where<M> {
  // reason: the keys are the model's field names, read from its facet at run time; gen checks them against the model
  return filter as unknown as Where<M>;
}

/** The model row of `entry`, under the model's field names. */
function rowOf<M extends object>(
  entry: JournalEntry<M>,
  fields: Fields,
): Parameters<Repository<M>["insert"]>[0] {
  const row = {
    [fields.account]: entry.account,
    [fields.amount]: entry.amount,
    [fields.kind]: entry.kind,
    [fields.reference]: entry.reference,
    [fields.at]: entry.at,
    ...(fields.currency === undefined ? {} : { [fields.currency]: entry.currency }),
  };
  // reason: as in `whereOf`, the keys are the model's field names read at run time
  return row as unknown as Parameters<Repository<M>["insert"]>[0];
}

/** The journal entry of a model row. */
function entryOf<M extends object>(row: object, fields: Fields): JournalEntry<M> {
  const record = row as Record<string, unknown>;
  return {
    account: String(record[fields.account]),
    amount: Number(record[fields.amount]),
    kind: record[fields.kind] as JournalEntry<M>["kind"],
    reference: String(record[fields.reference]),
    at: record[fields.at] as Date,
    ...(fields.currency === undefined ? {} : { currency: String(record[fields.currency]) }),
  };
}

/**
 * The journal over the entry model `M`.
 *
 * @example
 * export class PostgresLoyaltyLedgerDriver extends Driver(LoyaltyLedger) {
 *   constructor(private readonly journal: Journal<LedgerEntry>) {
 *     super();
 *   }
 *
 *   async debit(entry: PointsEntry): Promise<DebitOutcome> {
 *     const { written, belowFloor } = await this.journal.append({ account: entry.memberId, amount: entry.points, ... }, { floor: 0 });
 *     ...
 *   }
 * }
 */
export abstract class Journal<M extends object> extends Service {
  /** The entry model; the class `journalOf(Model)` makes sets it. */
  protected abstract readonly model: AnyClass<M>;

  /** The account locks. */
  private readonly locks: Locks;

  /**
   * @param locks - the server's named locks; a write that lowers a balance holds its account's.
   */
  constructor(locks: Locks) {
    super();
    this.locks = locks;
  }

  /**
   * The balance of `query.account`: the sum of its entries' amounts; zero when it has none.
   *
   * @param query - the account, the currency when the model has a currency field (balances are per currency, so a
   *                sum never mixes two), and the integer field to sum when it is not the journal's amount (a
   *                base-currency amount kept beside the transaction amount, ADR 0220 decision 1).
   * @throws TypeError when the model has a currency field and no currency is given, or has none and one is.
   */
  async balance(query: {
    readonly account: string;
    readonly currency?: string | undefined;
    readonly amount?: { [K in keyof M]-?: M[K] extends number ? K : never }[keyof M] & string;
  }): Promise<number> {
    const fields = this.fields();
    if ((fields.currency === undefined) !== (query.currency === undefined))
      throw new TypeError(
        `${this.model.name}'s balance is per currency exactly when its @Journaled names a currency field`,
      );
    return this.entries().sum(
      query.amount ?? fields.amount,
      whereOf<M>({
        [fields.account]: query.account,
        ...(fields.currency === undefined ? {} : { [fields.currency]: query.currency }),
      }),
    );
  }

  /** The entry under (`query.account`, `query.reference`), or null when there is none. */
  async find(query: {
    readonly account: string;
    readonly reference: string;
  }): Promise<JournalEntry<M> | null> {
    const fields = this.fields();
    const row = await this.entries().findOne(
      whereOf<M>({ [fields.account]: query.account, [fields.reference]: query.reference }),
    );
    return row === null ? null : entryOf<M>(row, fields);
  }

  /**
   * Every entry under `reference`, on any account, in the order written (time, then account): a posting's lines, so a
   * caller can tell a retried posting from a new one before checking a cap or a limit. Empty when none was written.
   */
  async lines(reference: string): Promise<JournalEntry<M>[]> {
    const fields = this.fields();
    const rows = await this.entries().find(
      whereOf<M>({ [fields.reference]: reference }),
      // reason: the order keys are the model's field names read at run time
      {
        orderBy: { [fields.at]: SortDirection.Asc, [fields.account]: SortDirection.Asc },
      } as unknown as Parameters<Repository<M>["find"]>[1],
    );
    return rows.map((row) => entryOf<M>(row, fields));
  }

  /**
   * Appends `entry` once per (account, reference). A write that lowers the balance holds the account's lock and is
   * refused, changing nothing, when it would leave the balance below the floor; a write that raises it is never
   * refused by a floor.
   *
   * @param options - `floor` overrides the model's default floor for this call; `null` lifts it.
   * @returns `written` false when the pair was already applied; `belowFloor` true when the floor refused it.
   * @throws RangeError when the amount is not a safe integer, or the currency is not an ISO 4217 code.
   * @throws TypeError when the currency is named and the model has no currency field, or the reverse.
   * @throws LockUnavailableError when another write held the account for the whole wait.
   */
  async append(
    entry: JournalEntry<M>,
    options: { readonly floor?: number | null } = {},
  ): Promise<JournalWrite> {
    assertAmount(entry.amount);
    const fields = this.fields();
    const currency = currencyOf(entry, fields);
    if (entry.amount >= 0) return (await this.insertOnce(entry, fields)) ? WRITTEN : NOT_WRITTEN;
    const floor = floorOf(options.floor, fields);
    return this.locked([entry.account], async () => {
      if ((await this.find(entry)) !== null) return NOT_WRITTEN;
      if (
        floor !== undefined &&
        (await this.balance({ account: entry.account, currency })) + entry.amount < floor
      )
        return BELOW_FLOOR;
      return (await this.insertOnce(entry, fields)) ? WRITTEN : NOT_WRITTEN;
    });
  }

  /**
   * Reverses, in one locked step, every entry of `where.account` that matches and is not reversed yet, oldest first.
   * Each reversal is a new entry of `reversal.kind` with the opposite amount, at `reversal.at`, under the original's
   * reference prefixed by `reversal.referencePrefix`, so repeating the call reverses nothing more and an entry that is
   * itself a reversal is never reversed. With a floor, a reversal that lowers the balance is cut so the balance stops
   * at the floor (to zero when nothing is left above it), and the cut reversal is still written, so the entry counts
   * as handled and a later call never takes the rest.
   *
   * @param where - the account, and optionally the kind and an instant the entries' `at` must be before.
   * @param reversal - the reversals' kind, reference prefix and time; `floor` as in `append`.
   * @returns the entries reversed, each with `amount` the part of it that was reversed, in the original's sign.
   * @throws LockUnavailableError when another write held the account for the whole wait.
   */
  async reverseWhere(
    where: {
      readonly account: string;
      readonly kind?: JournalEntry<M>["kind"];
      readonly before?: Date;
    },
    reversal: {
      readonly kind: JournalEntry<M>["kind"];
      readonly referencePrefix: string;
      readonly at: Date;
      readonly floor?: number | null;
    },
  ): Promise<JournalEntry<M>[]> {
    const fields = this.fields();
    const floor = floorOf(reversal.floor, fields);
    return this.locked([where.account], async () => {
      const rows = await this.entries().find(
        whereOf<M>({
          [fields.account]: where.account,
          ...(where.kind === undefined ? {} : { [fields.kind]: where.kind }),
          ...(where.before === undefined ? {} : { [fields.at]: { $lt: where.before } }),
        }),
        // reason: the order keys are the model's field names read at run time
        {
          orderBy: { [fields.at]: SortDirection.Asc, [fields.reference]: SortDirection.Asc },
        } as unknown as Parameters<Repository<M>["find"]>[1],
      );
      const candidates = rows
        .map((row) => entryOf<M>(row, fields))
        .filter((entry) => !entry.reference.startsWith(reversal.referencePrefix));
      const references = candidates.map((entry) => reversal.referencePrefix + entry.reference);
      const applied =
        references.length === 0
          ? []
          : await this.entries().find(
              whereOf<M>({
                [fields.account]: where.account,
                [fields.reference]: { $in: references },
              }),
            );
      const done = new Set(applied.map((row) => entryOf<M>(row, fields).reference));
      const balances = new Map<string | undefined, number>();
      const reversed: JournalEntry<M>[] = [];
      for (const entry of candidates) {
        const reference = reversal.referencePrefix + entry.reference;
        if (done.has(reference)) continue;
        const full = -entry.amount;
        const balance =
          balances.get(entry.currency) ??
          (floor === undefined
            ? 0
            : // oxlint-disable-next-line no-await-in-loop -- read once per currency, before its first reversal
              await this.balance({ account: where.account, currency: entry.currency }));
        const amount =
          floor === undefined || full >= 0 ? full : Math.min(0, Math.max(full, floor - balance));
        // oxlint-disable-next-line no-await-in-loop -- each reversal is cut against the balance the one before left
        await this.entries().insert(
          rowOf<M>(
            {
              account: where.account,
              amount,
              kind: reversal.kind,
              reference,
              at: reversal.at,
              ...(entry.currency === undefined ? {} : { currency: entry.currency }),
            },
            fields,
          ),
        );
        balances.set(entry.currency, balance + amount);
        reversed.push({ ...entry, amount: -amount || 0 }); // `|| 0`: a cut-to-nothing reversal reports 0, never -0
      }
      return reversed;
    });
  }

  /**
   * Posts a balanced entry in one locked step: every line on its own account, or none. The lines sum to zero and are
   * at least two; when any line's (account, reference) pair was already applied the whole posting is a duplicate. A
   * line's account that the posting lowers keeps the line's floor (the model's default when the line gives none).
   *
   * @returns `written` false when a pair was already applied; `belowFloor` true when an account would end below its
   *          floor; either way nothing was written.
   * @throws UnbalancedPostingError when the lines do not sum to zero, are fewer than two, or are not in one currency
   *         (a model with a currency field: every line names an ISO 4217 code and they all match).
   * @throws TypeError when two lines share an (account, reference) pair.
   * @throws RangeError when an amount is not a safe integer.
   * @throws LockUnavailableError when another write held an account for the whole wait.
   */
  async post(lines: readonly JournalLine<M>[]): Promise<JournalWrite> {
    for (const line of lines) assertAmount(line.amount);
    const fields = this.fields();
    const currencies = [...new Set(lines.map((line) => currencyOf(line, fields)))];
    const total = lines.reduce((sum, line) => sum + line.amount, 0);
    if (currencies.length > 1)
      throw UnbalancedPostingError.create({
        lines: lines.length,
        total,
        currencies: currencies.map(String),
      });
    if (lines.length < 2 || total !== 0)
      throw UnbalancedPostingError.create({ lines: lines.length, total });
    const pairs = new Set(lines.map((line) => JSON.stringify([line.account, line.reference])));
    if (pairs.size !== lines.length)
      throw new TypeError("Journal.post: two lines share an account and a reference");
    return this.locked(
      lines.map((line) => line.account),
      async () => {
        const applied = await this.entries().count(
          whereOf<M>({
            $or: lines.map((line) => ({
              [fields.account]: line.account,
              [fields.reference]: line.reference,
            })),
          }),
        );
        if (applied > 0) return NOT_WRITTEN;
        const change = new Map<string, number>();
        for (const line of lines)
          change.set(line.account, (change.get(line.account) ?? 0) + line.amount);
        for (const line of lines) {
          const floor = floorOf(line.floor, fields);
          const net = change.get(line.account) ?? 0;
          if (floor === undefined || net >= 0) continue;
          // oxlint-disable-next-line no-await-in-loop -- one balance read per lowered account, on the caller's connection
          if (
            (await this.balance({ account: line.account, currency: line.currency })) + net <
            floor
          )
            return BELOW_FLOOR;
        }
        for (const line of lines)
          // oxlint-disable-next-line no-await-in-loop -- the lines are written in order on the caller's connection
          await this.entries().insert(rowOf<M>(line, fields));
        return WRITTEN;
      },
    );
  }

  /** The repository of the entry model; a subclass may keep the entries elsewhere (a test's memory store). */
  protected entries(): Repository<M> {
    // reason: repositoryOf's token is a concrete CrudService subclass without constructor parameters, typed as the
    // abstract class every token is
    const Token = repositoryOf(this.model) as unknown as new () => Repository<M>;
    return new Token();
  }

  /**
   * The model's field map and default floor.
   *
   * @throws TypeError when the model does not carry `AppendOnly`: a ledger's entries are never updated (ADR 0220).
   */
  private fields(): Fields {
    if (!traitsOf(this.model).some((trait) => trait.name === "append_only"))
      throw new TypeError(
        `${this.model.name} is a journal's entry model, so it carries the AppendOnly trait`,
      );
    return { ...JOURNAL_FIELDS, ...Journaled.on(this.model) };
  }

  /** Runs `work` holding the lock of every account in `accounts`. */
  private locked<T>(accounts: readonly string[], work: () => Promise<T>): Promise<T> {
    return this.locks.with(
      accounts.map((account) => `ledger.journal:${this.model.name}:${account}`),
      JOURNAL_LOCK_TTL,
      () => work(),
    );
  }

  /** Inserts `entry` now; false, changing nothing, when its (account, reference) pair is already applied. */
  private async insertOnce(entry: JournalEntry<M>, fields: Fields): Promise<boolean> {
    try {
      await this.entries().insert(rowOf<M>(entry, fields));
      return true;
    } catch (error) {
      // the insert ran in its own savepoint, so the caller's transaction still serves the check
      if (error instanceof UniqueViolation && (await this.find(entry)) !== null) return false;
      throw error;
    }
  }
}
