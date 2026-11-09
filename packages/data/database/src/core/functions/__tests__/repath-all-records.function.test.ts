/**
 * Stackra file contract:
 * Purpose: tests of `repathAllRecords` on PGlite: when `platform.a.shop` moves to `platform.b.shop`, every row of each
 *          model with `MovesWithScope` at or below the old path takes the new prefix, whether its path column is
 *          `ltree` or `varchar`, a sibling subtree stays put, a model without the trait is never touched, a second
 *          run moves nothing, and each opted-in model answers one report.
 * Boundary: unit tier: PGlite runs in this process, no Docker. The rows are written outside row-level security; the
 *           listener's scope session is the caller's, as `repath` documents.
 * Runtime: node (vitest)
 * Governing contract: ADR 0411 (subtree move); ADR 0022; ADR 0269.
 */
import { EntitySchema } from "@mikro-orm/core";
import { HasPublicId, Model, MovesWithScope } from "@stackra/model";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { registerEntities } from "#core/functions/register-entities.function";
import { repathAllRecords } from "#core/functions/repath-all-records.function";
import { repositoryOf } from "#core/functions/repository-of.function";
import type { Repository } from "#core/types/repository.type";
import { MemoryDatabaseDriver } from "#testing/drivers/memory-database.driver";

/** A service's own model that follows its scope. */
class Ticket extends Model.with(HasPublicId("tkt"), MovesWithScope) {
  scopePath!: string;
}

/** A core package's model that follows its scope. */
class Remark extends Model.with(HasPublicId("rmk"), MovesWithScope) {
  scopePath!: string;
}

/** A model that keeps the path it was written with. */
class Receipt extends Model.with(HasPublicId("rcp")) {
  scopePath!: string;
}

/** The entity schema of `type`, a table with an id and a scope path stored as `columnType`. */
function schemaOf<M extends { id: string; scopePath: string }>(
  type: new () => M,
  table: string,
  columnType: "ltree" | "varchar(255)",
): EntitySchema<M> {
  return new EntitySchema<M>({
    class: type,
    schema: "moves",
    tableName: table,
    properties: {
      id: { type: "string", primary: true, columnType: "varchar(33)" },
      scopePath: { type: "string", fieldName: "scope_path", columnType },
    } as never,
  });
}

// a service table on `ltree`, a table whose path is `varchar` (as several os services store it), one opted out
registerEntities([
  schemaOf(Ticket, "tickets", "ltree"),
  schemaOf(Remark, "remarks", "varchar(255)"),
  schemaOf(Receipt, "receipts", "ltree"),
]);

/** A new repository of `type` on the connected database. */
const repository = <M extends object>(type: new () => M) =>
  Reflect.construct(repositoryOf(type), []) as Repository<M>;

/** The stored paths of `type`'s rows, by id. */
async function paths(
  type: new () => { id: string; scopePath: string },
): Promise<Record<string, string>> {
  const rows = await repository(type).find({});
  return Object.fromEntries(rows.map((row) => [row.id, row.scopePath]));
}

afterEach(async () => {
  await ACTIVE_DATABASE.current?.close();
}, 60_000);

// Each case boots a fresh PGlite (WASM Postgres plus four extensions), which takes seconds on a loaded runner.
describe("repathAllRecords", { timeout: 60_000 }, () => {
  it("moves every opted-in model's subtree rows, and leaves a sibling and an opted-out model put", async () => {
    const database = new MemoryDatabaseDriver();
    await database.transaction(async () => {
      for (const [type, prefix] of [
        [Ticket, "tkt"],
        [Remark, "rmk"],
        [Receipt, "rcp"],
      ] as const) {
        await repository(type as new () => Ticket).insertMany([
          { id: `${prefix}_01ja0000000000000000000001`, scopePath: "platform.a.shop" },
          { id: `${prefix}_01ja0000000000000000000002`, scopePath: "platform.a.shop.till" },
          { id: `${prefix}_01ja0000000000000000000003`, scopePath: "platform.a.other" },
        ] as never);
      }
    });
    const reports = await database.transaction(() =>
      repathAllRecords("platform.a.shop", "platform.b.shop"),
    );
    expect(reports).toEqual([
      { model: "Ticket", rows: 2 },
      { model: "Remark", rows: 2 },
    ]);
    for (const [type, prefix] of [
      [Ticket, "tkt"],
      [Remark, "rmk"],
    ] as const)
      expect(await paths(type)).toEqual({
        [`${prefix}_01ja0000000000000000000001`]: "platform.b.shop",
        [`${prefix}_01ja0000000000000000000002`]: "platform.b.shop.till",
        [`${prefix}_01ja0000000000000000000003`]: "platform.a.other",
      });
    expect(await paths(Receipt)).toEqual({
      rcp_01ja0000000000000000000001: "platform.a.shop",
      rcp_01ja0000000000000000000002: "platform.a.shop.till",
      rcp_01ja0000000000000000000003: "platform.a.other",
    });
    const again = await database.transaction(() =>
      repathAllRecords("platform.a.shop", "platform.b.shop"),
    );
    expect(again.map((report) => report.rows)).toEqual([0, 0]);
  });
});
