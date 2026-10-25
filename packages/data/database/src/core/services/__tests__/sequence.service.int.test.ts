/**
 * Stackra file contract:
 * Purpose: the conformance test of ADR 0342 on real Postgres through `usePostgres` and the compiled sequence
 *          migration: concurrent commits on one series take consecutive numbers, a rolled-back write leaves no gap, a
 *          wiped device's unused block and its skipped numbers appear as voids with their reasons, a released
 *          remainder is handed out before the counter moves (and the counter steps back over a tail block), and an
 *          unprivileged session of another scope sees none of a scope's counters.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers. The container's superuser writes (so the
 *           policies are proven by the unprivileged role's reads), and every write runs in `withScope`, as an action
 *           would.
 * Runtime: node (vitest)
 * Governing contract: ADR 0342 (decisions 2 to 4 and its enforcement line); ADR 0327 (decisions 3 and 9);
 *                     `.agents/rules/tenancy.md` (isolation test); ADR 0182; ADR 0269.
 */
import { EntitySchema } from "@mikro-orm/core";
import { Clock } from "@stackra/contracts";
import type { PublicId, ScopeRef } from "@stackra/contracts";
import { HasPublicId, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { CrudService } from "#core/bases/crud-service.base";
import { Migration } from "#core/bases/migration.base";
import { Sequence } from "#core/bases/sequence.base";
import { compileMigration } from "#core/functions/compile-migration.function";
import { registerModelPartners } from "#core/functions/register-model-partners.function";
import { registerSequences } from "#core/functions/register-sequences.function";
import { SequenceService } from "#core/services/sequence.service";
import type { Blueprint } from "#core/types/blueprint.type";
import type { SchemaBuilder } from "#core/types/schema-builder.type";
import { CreateSequenceTablesMigration } from "#node/database/migrations/0001-create-sequence-tables.migration";
import { usePostgres } from "#testing/use-postgres.fixture";

const acme: ScopeRef = { id: "scp_01ja0000000000000000000001", path: "platform.acme" };
const globex: ScopeRef = { id: "scp_01ja0000000000000000000003", path: "platform.globex" };

class Receipt extends Model.with(HasPublicId("rct")) {
  number!: string;
}

class ReceiptService extends CrudService<Receipt> {}

registerModelPartners([[ReceiptService, Receipt]]);

const ReceiptSchema = new EntitySchema<Receipt>({
  class: Receipt,
  schema: "docs",
  tableName: "receipts",
  properties: {
    id: { type: "string", primary: true, columnType: "varchar(33)" },
    number: { type: "string", columnType: "varchar(40)" },
  },
});

class CreateReceiptsMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.create("receipts", (t: Blueprint) => {
      t.hasPublicId("rct");
      t.string("number", 40).notNull().comment("The receipt's sequence number.");
    });
    schema.sql("create role sequence_reader nologin", { inverse: "drop role sequence_reader" });
    schema.sql("grant usage on schema database to sequence_reader", { inverse: false });
    schema.sql("grant select on all tables in schema database to sequence_reader", {
      inverse: false,
    });
  }
}

class ReceiptSequence extends Sequence({
  key: "receipt",
  format: "R{n:04}",
  reserve: { size: 5 },
}) {}

class TillSequence extends Sequence({ key: "till", series: ["deviceId"], reserve: { size: 10 } }) {}

registerSequences([
  { type: ReceiptSequence, key: "pos.receipt" },
  { type: TillSequence, key: "pos.till" },
]);

class FixedClock extends Clock {
  now(): Date {
    return new Date("2026-10-25T12:00:00Z");
  }
}

const postgres = usePostgres({
  entities: [ReceiptSchema],
  migrations: [
    compileMigration(CreateSequenceTablesMigration, { schema: "database", createsSchema: true }),
    compileMigration(CreateReceiptsMigration, { schema: "docs", createsSchema: true }),
  ],
});

let written = 0;

/** A fresh receipt id. */
function receiptId(): PublicId<"rct"> {
  written += 1;
  return `rct_01ja${String(written).padStart(22, "0")}`;
}

/** The sequence service over the test database. */
function sequences(): SequenceService {
  return new SequenceService(postgres.database, new FixedClock());
}

/** Writes one receipt in `scope` and numbers it as the last write, in one transaction; `fail` rolls it back. */
function issue(scope: ScopeRef, fail = false): Promise<string> {
  const receipts = new ReceiptService();
  return postgres.database.withScope(scope, async () => {
    const receipt = receipts.create({ id: receiptId(), number: "" });
    receipt.number = (await sequences().next(ReceiptSequence, scope)).formatted;
    if (fail) throw new Error("the write fails after its number was taken");
    return receipt.number;
  });
}

/** Runs `work` inside `scope`. */
function inScope<T>(scope: ScopeRef, work: (service: SequenceService) => Promise<T>): Promise<T> {
  return postgres.database.withScope(scope, () => work(sequences()));
}

/** Runs `sql` as the unprivileged role inside `scope`. */
function readAs(scope: ScopeRef, sql: string, params: readonly unknown[] = []) {
  const { database } = postgres;
  return database.withScope(scope, async () => {
    const em = database.em();
    await em.execute("set local role sequence_reader");
    return em.execute(sql, [...params]);
  });
}

describe("SequenceService on Postgres", () => {
  it("gives concurrent commits on one series consecutive numbers", async () => {
    const numbers = await Promise.all(Array.from({ length: 8 }, () => issue(acme)));
    expect([...numbers].sort()).toEqual(
      Array.from({ length: 8 }, (_, index) => `R${String(index + 1).padStart(4, "0")}`),
    );
  });

  it("leaves no gap after a rolled-back write", async () => {
    await expect(issue(acme, true)).rejects.toThrow(/the write fails/);
    expect(await issue(acme)).toBe("R0009");
    expect(await new ReceiptService().count()).toBe(9);
  });

  it("records a wiped device's unused numbers and its skipped ones as voids", async () => {
    const series = { deviceId: "dev_1" };
    const block = await inScope(globex, (service) =>
      service.reserve(TillSequence, globex, series, { holder: "dev_1" }),
    );
    expect([block.first, block.last]).toEqual([1, 10]);
    await inScope(globex, (service) =>
      service.claim(TillSequence, { block: block.id, holder: "dev_1", number: 1 }),
    );
    await inScope(globex, (service) =>
      service.claim(TillSequence, { block: block.id, holder: "dev_1", number: 3 }),
    );
    expect(await inScope(globex, (service) => service.void(block.id, "device wiped"))).toBe(7);
    expect(
      await readAs(
        globex,
        "select first_number, last_number, reason from database.sequence_voids where block_id = ? order by first_number",
        [block.id],
      ),
    ).toEqual([
      { first_number: 2, last_number: 2, reason: expect.stringMatching(/^skipped/) },
      { first_number: 4, last_number: 10, reason: "device wiped" },
    ]);
  });

  it("hands out a released remainder first and steps the counter back over a tail block", async () => {
    const reserve = (holder: string) =>
      inScope(globex, (service) => service.reserve(ReceiptSequence, globex, {}, { holder }));
    const first = await reserve("dev_2");
    const second = await reserve("dev_3");
    expect([first.first, first.last, second.first, second.last]).toEqual([1, 5, 6, 10]);
    await inScope(globex, (service) =>
      service.claim(ReceiptSequence, { block: first.id, holder: "dev_2", number: 1 }),
    );
    expect(await inScope(globex, (service) => service.release(first.id, "dev_2"))).toBe(4);
    expect(await issue(globex)).toBe("R0002");
    const third = await reserve("dev_4");
    expect([third.first, third.last]).toEqual([3, 5]);
    expect(await inScope(globex, (service) => service.release(second.id, "dev_3"))).toBe(5);
    expect(await issue(globex)).toBe("R0006");
  });

  it("shows another scope's session none of a scope's counters", async () => {
    const own = await readAs(acme, "select scope_id, last_number from database.sequence_counters");
    expect(own).toEqual([{ scope_id: acme.id, last_number: 9 }]);
    expect(
      await readAs(globex, "select * from database.sequence_counters where scope_id = ?", [
        acme.id,
      ]),
    ).toEqual([]);
  });
});
