/**
 * Stackra file contract:
 * Purpose: integration test of `CrudService.lock` on Postgres: locking a row, assigning a field and locking it again in
 *          one transaction keeps the assigned value (the second lock's refresh used to drop it), and the row is still
 *          held by that transaction (a `nowait` lock from another pooled backend fails); and a read after `update` or a
 *          plain field set on a loaded row, in the same transaction, sees the change (the read flushes first).
 * Boundary: test only; a Testcontainers Postgres through `usePostgres`, run by `test:int`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1239 (row locks).
 */
import { EntitySchema } from "@mikro-orm/core";
import type { PublicId } from "@stackra/contracts";
import { HasPublicId, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { CrudService } from "#core/bases/crud-service.base";
import { Migration } from "#core/bases/migration.base";
import { compileMigration } from "#core/functions/compile-migration.function";
import { registerModelPartners } from "#core/functions/register-model-partners.function";
import type { Blueprint } from "#core/types/blueprint.type";
import type { SchemaBuilder } from "#core/types/schema-builder.type";
import { usePostgres } from "#testing/use-postgres";

class Counter extends Model.with(HasPublicId("cnt")) {
  next!: number;
}

class CounterService extends CrudService<Counter> {}

registerModelPartners([[CounterService, Counter]]);

const CounterSchema = new EntitySchema<Counter>({
  class: Counter,
  schema: "docs",
  tableName: "counters",
  properties: {
    id: { type: "string", primary: true, columnType: "varchar(33)" },
    next: { type: "number", columnType: "integer" },
  },
});

class CreateCountersMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.create("counters", (t: Blueprint) => {
      t.hasPublicId("cnt");
      t.integer("next").notNull().comment("The next number to hand out.");
    });
  }
}

const postgres = usePostgres({
  entities: [CounterSchema],
  migrations: [compileMigration(CreateCountersMigration, { schema: "docs", createsSchema: true })],
});

const ID: PublicId<"cnt"> = "cnt_01ja0000000000000000000001";
const SECOND: PublicId<"cnt"> = "cnt_01ja0000000000000000000002";

describe("CrudService.lock on Postgres", () => {
  it("keeps a value assigned between two locks of one row in one transaction, and keeps the row held", async () => {
    const { database } = postgres;
    const counters = new CounterService();
    await database.transaction(async () => {
      counters.create({ id: ID, next: 1 });
    });

    let heldElsewhere: unknown;
    const seen = await database.transaction(async () => {
      const first = await counters.lock({ id: ID });
      first.next += 1;
      const second = await counters.lock({ id: ID });
      second.next += 1;
      // The raw connection with no transaction context takes another pooled backend; an em would join this one.
      heldElsewhere = await database
        .em()
        .getConnection()
        .execute("select id from docs.counters where id = ? for update nowait", [ID])
        .then(
          () => undefined,
          (error: unknown) => error,
        );
      return second.next;
    });

    expect(seen).toBe(3);
    // The other backend could not take the row while the transaction held it.
    expect(heldElsewhere).toBeDefined();
    const stored = await database.transaction(() => counters.findOneOrFail({ id: ID }));
    expect(stored.next).toBe(3);
  });

  it("reads a value set earlier in the same transaction, through update or a plain field set", async () => {
    const { database } = postgres;
    const counters = new CounterService();
    await database.transaction(async () => {
      counters.create({ id: SECOND, next: 10 });
    });

    const seen = await database.transaction(async () => {
      await counters.update({ id: SECOND }, { next: 11 });
      const afterUpdate = {
        findOne: (await counters.findOne({ next: 11 }))?.id,
        count: await counters.count({ next: 11 }),
        sum: await counters.sum("next", { id: SECOND }),
      };
      const row = await counters.findOneOrFail({ id: SECOND });
      row.next = 12;
      const afterSet = {
        find: (await counters.find({ next: 12 })).map((found) => found.id),
        page: (await counters.page({ page: 1, perPage: 10 }, { where: { next: 12 } })).total,
      };
      return { afterUpdate, afterSet };
    });

    expect(seen).toEqual({
      afterUpdate: { findOne: SECOND, count: 1, sum: 11 },
      afterSet: { find: [SECOND], page: 1 },
    });
  });
});
