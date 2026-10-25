/**
 * Stackra file contract:
 * Purpose: `SequenceService`, the one allocator of gapless document numbers: `next` takes a number inside the
 *          transaction that writes the document, `reserve` hands a device a block for offline issue, `claim` accepts
 *          the numbers the device issued from it in order, and `release` or `void` closes the block, returning its
 *          unused remainder to the series or recording it as voided numbers with a reason.
 * Boundary: raw SQL on the running context's entity manager, over this package's three sequence tables (no model, so
 *           no entity to register); every value is a bound parameter. Every change to a series first locks its counter
 *           row, which the transaction holds until it ends: two commits never share a number, a rolled-back write takes
 *           none, and the series serialises for as long as the transaction runs, so a handler calls `next` as its last
 *           write. A returned remainder is handed out before the counter moves, lowest first, so every number ends up a
 *           document or an explained void. `next` and `claim` refuse to run outside a transaction, where the number
 *           would commit without its document. Row-level security limits every statement to the session's granted
 *           scopes (`Database.withScope`), so a scope outside them fails the write.
 * Runtime: node
 * Governing contract: ADR 0342 (decisions 2 to 5); ADR 0160 (raw SQL is parameterised, in this package); ADR 0136
 *                     (decision 2: one transaction per action); ADR 0327 (decisions 3 and 9); ADR 0338.
 */
import type { EntityManager } from "@mikro-orm/postgresql";
import { Service, kindOf } from "@stackra/container";
import type { Clock, PublicId, ScopeRef } from "@stackra/contracts";
import { NotFoundError } from "@stackra/errors";

import { SEQUENCE_REGISTRY } from "#core/constants/sequence-registry.constant";
import { SequenceBlockClosedError } from "#core/errors/sequence-block-closed.error";
import { SequenceNotReservableError } from "#core/errors/sequence-not-reservable.error";
import { SequenceNumberOutOfOrderError } from "#core/errors/sequence-number-out-of-order.error";
import { formatSequenceNumber } from "#core/functions/format-sequence-number.function";
import { mintSequenceBlockId } from "#core/functions/mint-sequence-block-id.function";
import type { Database } from "#core/ports/database.port";
import type { SequenceBlock } from "#core/types/sequence-block.type";
import type { SequenceClass } from "#core/types/sequence-class.type";
import type { SequenceNumber } from "#core/types/sequence-number.type";
import type { SequenceReserveOptions } from "#core/types/sequence-reserve-options.type";
import type { SequenceSeries } from "#core/types/sequence-series.type";

/** The counter table: one row per sequence, scope node, series and period. */
const COUNTERS = '"database"."sequence_counters"';

/** The block table: reserved blocks and returned remainders. */
const BLOCKS = '"database"."sequence_blocks"';

/** The void table: numbers that will never be documents. */
const VOIDS = '"database"."sequence_voids"';

/** The columns that name one counter. */
const COUNTER = "sequence_key = ? and scope_id = ? and series = ? and period = ?";

/** The longest series value list a counter row holds (the column's length). */
const MAX_SERIES = 500;

/** The longest holder and reason the columns hold. */
const MAX_HOLDER = 63;
const MAX_REASON = 500;

/** The reason recorded for the numbers a device skipped. */
const SKIPPED = "skipped: the holder issued a later number of the block first";

/** The normalised options `Sequence` recorded. */
interface RecordedOptions {
  readonly series: readonly string[];
  readonly format: string;
  readonly reset: "never" | "yearly";
  readonly reserve: { readonly size: number } | false;
}

/** One counter: the locked key, the scope, the series values and the period, with the options. */
interface Counter {
  readonly key: string;
  readonly scope: ScopeRef;
  readonly series: string;
  readonly period: number;
  readonly options: RecordedOptions;
}

/** An open, held block row, locked for the transaction. */
interface BlockRow {
  readonly id: PublicId<"sqb">;
  readonly key: string;
  readonly scope: ScopeRef;
  readonly series: string;
  readonly period: number;
  readonly last: number;
  readonly issuedThrough: number;
}

/** The rows a statement returned. */
async function rowsOf(
  em: EntityManager,
  sql: string,
  params: readonly unknown[],
): Promise<readonly Record<string, unknown>[]> {
  return (await em.execute(sql, [...params])) as unknown as readonly Record<string, unknown>[];
}

/**
 * A whole number read back from the tables (Postgres integers may arrive as strings).
 *
 * @throws TypeError for anything else, which means the tables were changed by hand.
 */
function int(value: unknown): number {
  const number = Number(value);
  if (value === null || value === undefined || !Number.isSafeInteger(number))
    throw new TypeError(
      `The sequence tables returned ${String(value)} where a whole number belongs`,
    );
  return number;
}

/**
 * The year of `at` in `timeZone`.
 *
 * @throws RangeError for an unknown time zone.
 */
function yearOf(at: Date, timeZone: string): number {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric" }).format(at));
}

/** A number in its format, with its period. */
function numberOf(format: string, number: number, period: number): SequenceNumber {
  return {
    number,
    period,
    formatted: formatSequenceNumber(format, number, period === 0 ? undefined : period),
  };
}

/**
 * Allocates and accounts for the numbers of every sequence.
 *
 * @example
 * // inside the action that writes the invoice, as its last write
 * const invoice = invoices.create({ ...draft, number: "" });
 * invoice.number = (await sequences.next(InvoiceSequence, ctx.scope, { legalEntityId }, ctx.timeZone)).formatted;
 */
export class SequenceService extends Service {
  /** The connected database whose running transaction every allocation joins. */
  private readonly database: Database;

  /** The time the period of a yearly sequence is read from. */
  private readonly clock: Clock;

  /**
   * @param database - the connected database.
   * @param clock - the time source, so a test can pin the period.
   */
  constructor(database: Database, clock: Clock) {
    super();
    this.database = database;
    this.clock = clock;
  }

  /**
   * The next number of `sequence` in `scope` and `series`, taken in the running transaction: it commits with the
   * document or not at all.
   *
   * @param timeZone - the IANA time zone the year of a yearly sequence is read in (the call's `ctx.timeZone`).
   * @throws Error outside a transaction.
   * @throws TypeError for an unregistered sequence or a series that does not match its dimensions.
   * @throws RangeError for an unknown time zone.
   */
  async next(
    sequence: SequenceClass,
    scope: ScopeRef,
    series: SequenceSeries = {},
    timeZone = "UTC",
  ): Promise<SequenceNumber> {
    const em = this.transactionEm("next");
    const counter = this.counterOf(sequence, scope, series, timeZone);
    const { first } = await this.take(em, counter, 1);
    return numberOf(counter.options.format, first, counter.period);
  }

  /**
   * Reserves a block of numbers for `options.holder` to issue offline, in order. A block re-handing a returned
   * remainder may be smaller than asked.
   *
   * @throws SequenceNotReservableError when the sequence declares `reserve: false`.
   * @throws TypeError for an unregistered sequence, a bad series or an empty holder.
   * @throws RangeError for a size outside 1 to the declared size, or an unknown time zone.
   */
  async reserve(
    sequence: SequenceClass,
    scope: ScopeRef,
    series: SequenceSeries,
    options: SequenceReserveOptions,
  ): Promise<SequenceBlock> {
    const counter = this.counterOf(sequence, scope, series, options.timeZone ?? "UTC");
    const { reserve, format } = counter.options;
    if (reserve === false) throw SequenceNotReservableError.create({ sequence: counter.key });
    const size = options.size ?? reserve.size;
    if (!Number.isInteger(size) || size < 1 || size > reserve.size)
      throw new RangeError(
        `Sequence ${counter.key}: a block holds 1 to ${reserve.size} numbers, got ${size}`,
      );
    const { holder } = options;
    if (typeof holder !== "string" || holder === "" || holder.length > MAX_HOLDER)
      throw new TypeError(
        `Sequence ${counter.key}: the holder is a device id of 1 to 63 characters`,
      );
    return this.database.transaction(async () => {
      const em = this.database.em();
      const { first, last } = await this.take(em, counter, size);
      const id = mintSequenceBlockId();
      // raw-sql: the block row records who holds which numbers, for claims and for the audit (ADR 0342 d4)
      await em.execute(
        `insert into ${BLOCKS} (id, sequence_key, scope_id, scope_path, series, period, holder, first_number, last_number, issued_through) ` +
          "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          id,
          counter.key,
          scope.id,
          scope.path,
          counter.series,
          counter.period,
          holder,
          first,
          last,
          first - 1,
        ],
      );
      return { id, holder, period: counter.period, first, last, format };
    });
  }

  /**
   * Accepts a number the holder issued offline from its block, for the document being written in the running
   * transaction. The number must be ahead of the last one accepted; the numbers it skips are recorded as voids.
   *
   * @throws Error outside a transaction.
   * @throws NotFoundError when the block does not exist, belongs to another holder or to another sequence.
   * @throws SequenceBlockClosedError when the block was released or voided.
   * @throws SequenceNumberOutOfOrderError when the number is not ahead of the last accepted one or is outside the block.
   */
  async claim(
    sequence: SequenceClass,
    request: { readonly block: PublicId<"sqb">; readonly holder: string; readonly number: number },
  ): Promise<SequenceNumber> {
    const em = this.transactionEm("claim");
    const { key, options } = this.registrationOf(sequence);
    const block = await this.lockBlock(em, request.block, request.holder);
    if (block.key !== key) throw NotFoundError.create();
    const expected = block.issuedThrough + 1;
    const { number } = request;
    if (!Number.isSafeInteger(number) || number < expected || number > block.last)
      throw SequenceNumberOutOfOrderError.create({
        block: block.id,
        expected,
        received: number,
      });
    if (number > expected) await this.voidRange(em, block, expected, number - 1, SKIPPED);
    // raw-sql: the block's accepted mark moves to the claimed number, in the document's transaction
    await em.execute(`update ${BLOCKS} set issued_through = ?, updated_at = now() where id = ?`, [
      number,
      block.id,
    ]);
    return numberOf(options.format, number, block.period);
  }

  /**
   * Closes `block` at the holder's next sync: its numbers after the last accepted one go back to the series (the
   * counter steps back when the block is its tail, else they wait to be handed out first).
   *
   * @returns how many numbers went back.
   * @throws NotFoundError when the block does not exist or belongs to another holder.
   * @throws SequenceBlockClosedError when the block was already released or voided.
   */
  release(block: PublicId<"sqb">, holder: string): Promise<number> {
    return this.database.transaction(async () => {
      const em = this.database.em();
      const row = await this.lockBlock(em, block, holder);
      const from = row.issuedThrough + 1;
      if (from <= row.last) {
        const params = [row.key, row.scope.id, row.series, row.period];
        // raw-sql: the counter row is locked before the remainder goes back, as for every change to the series
        const [counter] = await rowsOf(
          em,
          `select last_number from ${COUNTERS} where ${COUNTER} for update`,
          params,
        );
        if (counter !== undefined && int(counter["last_number"]) === row.last) {
          // raw-sql: the block is the counter's tail, so the counter steps back over the remainder
          await em.execute(
            `update ${COUNTERS} set last_number = ?, updated_at = now() where ${COUNTER}`,
            [from - 1, ...params],
          );
        } else {
          // raw-sql: the remainder waits, unheld, to be handed out before the counter moves again
          await em.execute(
            `insert into ${BLOCKS} (id, sequence_key, scope_id, scope_path, series, period, holder, first_number, last_number, issued_through) ` +
              "values (?, ?, ?, ?, ?, ?, null, ?, ?, ?)",
            [
              mintSequenceBlockId(),
              row.key,
              row.scope.id,
              row.scope.path,
              row.series,
              row.period,
              from,
              row.last,
              from - 1,
            ],
          );
        }
      }
      await this.close(em, row.id);
      return Math.max(0, row.last - from + 1);
    });
  }

  /**
   * Closes `block` for good, as when its device is wiped: its numbers after the last accepted one are recorded as
   * voided numbers with `reason`.
   *
   * @returns how many numbers were voided.
   * @throws TypeError for an empty reason or one longer than 500 characters.
   * @throws NotFoundError when the block does not exist.
   * @throws SequenceBlockClosedError when the block was already released or voided.
   */
  async void(block: PublicId<"sqb">, reason: string): Promise<number> {
    if (typeof reason !== "string" || reason.trim() === "" || reason.length > MAX_REASON)
      throw new TypeError("A void states its reason in 1 to 500 characters, for the audit");
    return this.database.transaction(async () => {
      const em = this.database.em();
      const row = await this.lockBlock(em, block, undefined);
      const from = row.issuedThrough + 1;
      if (from <= row.last) await this.voidRange(em, row, from, row.last, reason);
      await this.close(em, row.id);
      return Math.max(0, row.last - from + 1);
    });
  }

  /**
   * The entity manager of the running transaction.
   *
   * @throws Error outside a transaction.
   */
  private transactionEm(method: string): EntityManager {
    const em = this.database.em();
    if (!em.isInTransaction())
      throw new Error(
        `SequenceService.${method} runs inside the transaction that writes the document, so a rolled-back write takes no number`,
      );
    return em;
  }

  /**
   * The locked key and the recorded options of `sequence`.
   *
   * @throws TypeError when it is not a sequence or gen has not registered it.
   */
  private registrationOf(sequence: SequenceClass): {
    readonly key: string;
    readonly options: RecordedOptions;
  } {
    const record = kindOf(sequence);
    if (record?.kind !== "sequence")
      throw new TypeError(`${sequence.name} does not extend Sequence({ key })`);
    const registration = SEQUENCE_REGISTRY.get(sequence);
    if (registration === undefined)
      throw new TypeError(
        `No locked key is registered for ${sequence.name}: gen registers it with registerSequences`,
      );
    return { key: registration.key, options: record.options as unknown as RecordedOptions };
  }

  /**
   * The counter `sequence`, `scope` and `series` name now.
   *
   * @throws TypeError for an unregistered sequence or a series that does not match its dimensions.
   * @throws RangeError for series values too long for the column, or an unknown time zone.
   */
  private counterOf(
    sequence: SequenceClass,
    scope: ScopeRef,
    series: SequenceSeries,
    timeZone: string,
  ): Counter {
    const { key, options } = this.registrationOf(sequence);
    const given = Object.keys(series);
    if (
      given.length !== options.series.length ||
      options.series.some((name) => typeof series[name] !== "string" || series[name] === "")
    )
      throw new TypeError(
        `Sequence ${key} counts per [${options.series.join(", ")}], got [${given.join(", ")}]`,
      );
    const values = JSON.stringify(options.series.map((name) => series[name]));
    if (values.length > MAX_SERIES)
      throw new RangeError(
        `Sequence ${key}: the series values are longer than ${MAX_SERIES} characters`,
      );
    const period = options.reset === "yearly" ? yearOf(this.clock.now(), timeZone) : 0;
    return { key, scope, series: values, period, options };
  }

  /** Takes `size` numbers (fewer when a returned remainder is smaller) from `counter`, holding its row lock. */
  private async take(
    em: EntityManager,
    counter: Counter,
    size: number,
  ): Promise<{ readonly first: number; readonly last: number }> {
    const params = [counter.key, counter.scope.id, counter.series, counter.period];
    // raw-sql: the counter row is created on first use and locked for the transaction; every change to the series
    // takes this lock first, so commits never share a number and a rollback returns its own (ADR 0342 d2)
    await em.execute(
      `insert into ${COUNTERS} (sequence_key, scope_id, scope_path, series, period) values (?, ?, ?, ?, ?) ` +
        "on conflict (sequence_key, scope_id, series, period) do update set updated_at = now()",
      [counter.key, counter.scope.id, counter.scope.path, counter.series, counter.period],
    );
    // raw-sql: a returned remainder is handed out before the counter moves, lowest numbers first (ADR 0342 d4)
    const [returned] = await rowsOf(
      em,
      `select id, first_number, last_number from ${BLOCKS} where ${COUNTER} and holder is null order by first_number limit 1`,
      params,
    );
    if (returned !== undefined) {
      const first = int(returned["first_number"]);
      const end = int(returned["last_number"]);
      const last = Math.min(end, first + size - 1);
      if (last === end) {
        // raw-sql: the remainder is used up; the released block it came from keeps the history
        await em.execute(`delete from ${BLOCKS} where id = ?`, [returned["id"]]);
      } else {
        // raw-sql: the remainder shrinks from its low end
        await em.execute(
          `update ${BLOCKS} set first_number = ?, issued_through = ?, updated_at = now() where id = ?`,
          [last + 1, last, returned["id"]],
        );
      }
      return { first, last };
    }
    // raw-sql: the counter moves by `size` in the row this transaction holds
    const [moved] = await rowsOf(
      em,
      `update ${COUNTERS} set last_number = last_number + ?, updated_at = now() where ${COUNTER} returning last_number`,
      [size, ...params],
    );
    const last = int(moved?.["last_number"]);
    return { first: last - size + 1, last };
  }

  /**
   * Locks the open, held block `id`, of `holder` when one is named.
   *
   * @throws NotFoundError when no such block is visible, it is a returned remainder, or another holder has it.
   * @throws SequenceBlockClosedError when it was released or voided.
   */
  private async lockBlock(
    em: EntityManager,
    id: PublicId<"sqb">,
    holder: string | undefined,
  ): Promise<BlockRow> {
    // raw-sql: the block row is locked for the transaction, so two claims never accept one number
    const [row] = await rowsOf(
      em,
      "select id, sequence_key, scope_id, scope_path::text as scope_path, series, period, holder, last_number, " +
        `issued_through, released_at from ${BLOCKS} where id = ? for update`,
      [id],
    );
    if (
      row === undefined ||
      row["holder"] === null ||
      (holder !== undefined && row["holder"] !== holder)
    )
      throw NotFoundError.create();
    if (row["released_at"] !== null) throw SequenceBlockClosedError.create({ block: id });
    return {
      id,
      key: String(row["sequence_key"]),
      scope: { id: String(row["scope_id"]) as PublicId<"scp">, path: String(row["scope_path"]) },
      series: String(row["series"]),
      period: int(row["period"]),
      last: int(row["last_number"]),
      issuedThrough: int(row["issued_through"]),
    };
  }

  /** Records `first` to `last` of `block` as voided with `reason`. */
  private async voidRange(
    em: EntityManager,
    block: BlockRow,
    first: number,
    last: number,
    reason: string,
  ): Promise<void> {
    // raw-sql: a voided range is a row of its own, with its reason and its block, for the audit (ADR 0342 d4)
    await em.execute(
      `insert into ${VOIDS} (sequence_key, scope_id, scope_path, series, period, first_number, last_number, reason, block_id) ` +
        "values (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        block.key,
        block.scope.id,
        block.scope.path,
        block.series,
        block.period,
        first,
        last,
        reason,
        block.id,
      ],
    );
  }

  /** Marks `id` released; nothing more is claimed from it. */
  private async close(em: EntityManager, id: PublicId<"sqb">): Promise<void> {
    // raw-sql: the block closes in the transaction that returned or voided its remainder
    await em.execute(`update ${BLOCKS} set released_at = now(), updated_at = now() where id = ?`, [
      id,
    ]);
  }
}
