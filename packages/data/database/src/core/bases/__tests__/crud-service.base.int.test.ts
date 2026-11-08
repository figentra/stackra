/**
 * Stackra file contract:
 * Purpose: integration test of `CrudService.lock` on Postgres: locking a row, assigning a field and locking it again in
 *          one transaction keeps the assigned value (the second lock's refresh used to drop it), and the row is still
 *          held by that transaction (a `nowait` lock from another connection fails).
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
import { PostgresDatabaseDriver } from "#node/drivers/postgres-database.driver";
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

describe("CrudService.lock on Postgres", () => {
  it("keeps a value assigned between two locks of one row in one transaction, and keeps the row held", async () => {
    const { database } = postgres;
    const counters = new CounterService();
    await database.transaction(async () => {
      counters.create({ id: ID, next: 1 });
    });

    // A second connection, outside any retrying transaction, to see whether the row is still held.
    const other = await PostgresDatabaseDriver.connect({ url: postgres.url });
    let heldElsewhere: unknown;
    try {
      const seen = await database.transaction(async () => {
        const first = await counters.lock({ id: ID });
        first.next += 1;
        const second = await counters.lock({ id: ID });
        second.next += 1;
        // the raw connection, not `em()`: an em would join the running transaction through the shared context
        heldElsewhere = await other.orm.em
          .getConnection()
          .execute("select id from docs.counters where id = ? for update nowait", [ID])
          .then(
            () => undefined,
            (error: unknown) => error,
          );
        return second.next;
      });
      expect(seen).toBe(3);
    } finally {
      await other.close();
    }

    // The other connection could not take the row while the transaction held it.
    expect(heldElsewhere).toBeDefined();
    const stored = await database.transaction(() => counters.findOneOrFail({ id: ID }));
    expect(stored.next).toBe(3);
  });
});
