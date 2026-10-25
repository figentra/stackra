/**
 * Stackra file contract:
 * Purpose: unit tests of `SequenceService`: `next` locks the counter row, hands out a returned remainder first and
 *          otherwise moves the counter, formats with the period read in the call's time zone, and refuses outside a
 *          transaction, for an unregistered sequence or a series that does not match; `reserve` records a block and
 *          refuses a sequence that takes none, an oversized block and an empty holder; `claim` accepts numbers ahead
 *          of the last one and voids those it skips, and refuses a number behind it or outside the block, another
 *          holder's or another sequence's block and a closed one; `release` steps the counter back when the block is
 *          its tail and otherwise leaves the remainder to be handed out first; `void` records the remainder with its
 *          reason.
 * Boundary: test only; a scripted entity manager answers each statement in turn and records it, so no database runs.
 *           The real-Postgres conformance is `sequence.service.int.test.ts`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0342 (decisions 2 to 4); ADR 0160; ADR 0022; ADR 0269.
 */
import type { EntityManager } from "@mikro-orm/postgresql";
import { Clock } from "@stackra/contracts";
import type { ScopeRef } from "@stackra/contracts";
import { NotFoundError } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";
import type { Mock } from "vitest";

import { Sequence } from "#core/bases/sequence.base";
import { SequenceBlockClosedError } from "#core/errors/sequence-block-closed.error";
import { SequenceNotReservableError } from "#core/errors/sequence-not-reservable.error";
import { SequenceNumberOutOfOrderError } from "#core/errors/sequence-number-out-of-order.error";
import { registerSequences } from "#core/functions/register-sequences.function";
import { Database } from "#core/ports/database.port";
import { SequenceService } from "#core/services/sequence.service";

class InvoiceSequence extends Sequence({
  key: "invoice",
  series: ["legalEntityId"],
  format: "INV-{year}-{n:06}",
  reset: "yearly",
  reserve: { size: 50 },
}) {}

class ReceiptSequence extends Sequence({ key: "receipt" }) {}

class OrphanSequence extends Sequence({ key: "orphan" }) {}

registerSequences([
  { type: InvoiceSequence, key: "billing.invoice" },
  { type: ReceiptSequence, key: "pos.receipt" },
]);

const scope: ScopeRef = { id: "scp_01ja0000000000000000000001", path: "platform.acme" };

const block = "sqb_01ja0000000000000000000001";

/** Half past ten on New Year's Eve in UTC: already 2027 in Riyadh. */
class NewYearsEveClock extends Clock {
  now(): Date {
    return new Date("2026-12-31T22:30:00Z");
  }
}

/** A database whose entity manager answers each statement with the next of `results`. */
class ScriptedDatabase extends Database {
  readonly execute: Mock<(sql: string, params?: unknown[]) => Promise<unknown>>;

  private readonly manager: EntityManager;

  constructor(results: unknown[][], inTransaction = true) {
    super();
    this.execute = vi.fn(async (_sql: string, _params?: unknown[]) => results.shift() ?? []);
    this.manager = {
      execute: this.execute,
      isInTransaction: () => inTransaction,
    } as unknown as EntityManager;
  }

  em(): EntityManager {
    return this.manager;
  }

  transaction<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }

  withScope<T>(_scopes: unknown, work: () => Promise<T>): Promise<T> {
    return work();
  }

  async close(): Promise<void> {
    await Promise.resolve();
  }
}

/** A service over a scripted database. */
function serviceWith(results: unknown[][], inTransaction = true) {
  const database = new ScriptedDatabase(results, inTransaction);
  return { service: new SequenceService(database, new NewYearsEveClock()), database };
}

/** The `index`th statement and its parameters. */
function statement(database: ScriptedDatabase, index: number) {
  const [sql = "", params = []] = database.execute.mock.calls[index] ?? [];
  return { sql, params };
}

/** A held block row of the invoice sequence: numbers 1 to 50, 1 to `issued` accepted. */
function blockRow(issued: number, overrides: Record<string, unknown> = {}) {
  return {
    id: block,
    sequence_key: "billing.invoice",
    scope_id: scope.id,
    scope_path: scope.path,
    series: '["le_1"]',
    period: 2026,
    holder: "dev_1",
    last_number: 50,
    issued_through: issued,
    released_at: null,
    ...overrides,
  };
}

describe(SequenceService, () => {
  it("takes the next number from the locked counter, in the call's time zone", async () => {
    const { service, database } = serviceWith([[], [], [{ last_number: "42" }]]);
    expect(
      await service.next(InvoiceSequence, scope, { legalEntityId: "le_1" }, "Asia/Riyadh"),
    ).toEqual({ number: 42, period: 2027, formatted: "INV-2027-000042" });
    const lock = statement(database, 0);
    expect(lock.sql).toContain('insert into "database"."sequence_counters"');
    expect(lock.sql).toContain("on conflict (sequence_key, scope_id, series, period) do update");
    expect(lock.params).toEqual(["billing.invoice", scope.id, scope.path, '["le_1"]', 2027]);
    expect(statement(database, 1).sql).toContain("holder is null order by first_number limit 1");
    expect(statement(database, 2).params).toEqual([
      1,
      "billing.invoice",
      scope.id,
      '["le_1"]',
      2027,
    ]);
  });

  it("hands out a returned remainder before the counter moves", async () => {
    const shrink = serviceWith([[], [{ id: "sqb_r", first_number: 7, last_number: 9 }], []]);
    expect(await shrink.service.next(ReceiptSequence, scope)).toEqual({
      number: 7,
      period: 0,
      formatted: "7",
    });
    expect(statement(shrink.database, 2)).toMatchObject({ params: [8, 7, "sqb_r"] });
    const last = serviceWith([[], [{ id: "sqb_r", first_number: 9, last_number: 9 }], []]);
    expect((await last.service.next(ReceiptSequence, scope)).number).toBe(9);
    expect(statement(last.database, 2).sql).toContain('delete from "database"."sequence_blocks"');
  });

  it("refuses outside a transaction, an unregistered sequence and a series that does not match", async () => {
    await expect(serviceWith([], false).service.next(ReceiptSequence, scope)).rejects.toThrow(
      /runs inside the transaction/,
    );
    const { service } = serviceWith([]);
    await expect(service.next(OrphanSequence, scope)).rejects.toThrow(/No locked key/);
    await expect(service.next(InvoiceSequence, scope)).rejects.toThrow(
      /counts per \[legalEntityId\]/,
    );
    await expect(
      service.next(InvoiceSequence, scope, { legalEntityId: "le_1", locationId: "loc_1" }),
    ).rejects.toThrow(/counts per/);
    await expect(
      service.next(InvoiceSequence, scope, { legalEntityId: "le_1" }, "Mars/Olympus"),
    ).rejects.toThrow(RangeError);
  });

  it("reserves a block, and refuses a sequence that takes none, an oversized block and an empty holder", async () => {
    const { service, database } = serviceWith([[], [], [{ last_number: 50 }], []]);
    const reserved = await service.reserve(
      InvoiceSequence,
      scope,
      { legalEntityId: "le_1" },
      { holder: "dev_1" },
    );
    expect(reserved).toMatchObject({
      holder: "dev_1",
      period: 2026,
      first: 1,
      last: 50,
      format: "INV-{year}-{n:06}",
    });
    expect(reserved.id).toMatch(/^sqb_[0-9a-z]{26}$/);
    expect(statement(database, 3).params).toEqual([
      reserved.id,
      "billing.invoice",
      scope.id,
      scope.path,
      '["le_1"]',
      2026,
      "dev_1",
      1,
      50,
      0,
    ]);
    await expect(
      service.reserve(ReceiptSequence, scope, {}, { holder: "dev_1" }),
    ).rejects.toBeInstanceOf(SequenceNotReservableError);
    await expect(
      service.reserve(
        InvoiceSequence,
        scope,
        { legalEntityId: "le_1" },
        { holder: "dev_1", size: 51 },
      ),
    ).rejects.toThrow(RangeError);
    await expect(
      service.reserve(InvoiceSequence, scope, { legalEntityId: "le_1" }, { holder: "" }),
    ).rejects.toThrow(TypeError);
  });

  it("claims numbers ahead of the last one and voids the ones skipped", async () => {
    const { service, database } = serviceWith([[blockRow(3)], [], []]);
    expect(await service.claim(InvoiceSequence, { block, holder: "dev_1", number: 6 })).toEqual({
      number: 6,
      period: 2026,
      formatted: "INV-2026-000006",
    });
    expect(statement(database, 0).sql).toContain("for update");
    const voided = statement(database, 1);
    expect(voided.sql).toContain('insert into "database"."sequence_voids"');
    expect(voided.params.slice(5, 7)).toEqual([4, 5]);
    expect(voided.params.at(-1)).toBe(block);
    expect(statement(database, 2).params).toEqual([6, block]);
  });

  it("refuses a claim behind the last number, outside the block, or on a block it may not claim from", async () => {
    const claim = (row: object, number: number, holder = "dev_1") =>
      serviceWith([[row]]).service.claim(InvoiceSequence, { block, holder, number });
    const behind = await claim(blockRow(3), 3).catch((error: unknown) => error);
    expect(behind).toBeInstanceOf(SequenceNumberOutOfOrderError);
    expect((behind as SequenceNumberOutOfOrderError).details).toEqual({
      block,
      expected: 4,
      received: 3,
    });
    await expect(claim(blockRow(3), 51)).rejects.toBeInstanceOf(SequenceNumberOutOfOrderError);
    await expect(claim(blockRow(3), 4, "dev_2")).rejects.toBeInstanceOf(NotFoundError);
    await expect(claim(blockRow(3, { sequence_key: "pos.receipt" }), 4)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(claim(blockRow(3, { released_at: new Date() }), 4)).rejects.toBeInstanceOf(
      SequenceBlockClosedError,
    );
    await expect(
      serviceWith([], false).service.claim(InvoiceSequence, { block, holder: "dev_1", number: 4 }),
    ).rejects.toThrow(/runs inside the transaction/);
  });

  it("releases a block: the counter steps back when it is the tail, else the remainder waits", async () => {
    const tail = serviceWith([[blockRow(10)], [{ last_number: 50 }], [], []]);
    expect(await tail.service.release(block, "dev_1")).toBe(40);
    expect(statement(tail.database, 2)).toMatchObject({
      params: [10, "billing.invoice", scope.id, '["le_1"]', 2026],
    });
    expect(statement(tail.database, 3).sql).toContain("set released_at = now()");
    const behind = serviceWith([[blockRow(10)], [{ last_number: 80 }], [], []]);
    expect(await behind.service.release(block, "dev_1")).toBe(40);
    const remainder = statement(behind.database, 2);
    expect(remainder.sql).toContain('insert into "database"."sequence_blocks"');
    expect(remainder.params.slice(1)).toEqual([
      "billing.invoice",
      scope.id,
      scope.path,
      '["le_1"]',
      2026,
      11,
      50,
      10,
    ]);
    const used = serviceWith([[blockRow(50)], []]);
    expect(await used.service.release(block, "dev_1")).toBe(0);
    expect(used.database.execute).toHaveBeenCalledTimes(2);
  });

  it("voids a block's remainder with its reason, and refuses an empty reason", async () => {
    const { service, database } = serviceWith([[blockRow(10)], [], []]);
    expect(await service.void(block, "device wiped")).toBe(40);
    const voided = statement(database, 1);
    expect(voided.params.slice(5)).toEqual([11, 50, "device wiped", block]);
    await expect(service.void(block, "  ")).rejects.toThrow(/states its reason/);
  });
});
