/**
 * Stackra file contract:
 * Purpose: tests of `RepathOnScopeMovedListener` on PGlite: it is a queued listener with back-off, and a move it handles
 *          re-paths a `MovesWithScope` model's rows from the event's old path to its new one (the node's own row and
 *          the rows below it) and leaves a sibling put.
 * Boundary: unit tier: PGlite runs in this process, no Docker; the test table is created here, since PGlite starts
 *           from this package's migrations. `repathAllRecords`' own tests cover the model rules.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0411.
 */
import { kindOf } from "@stackra/container";
import { EntitySchema, registerEntities, repositoryOf } from "@stackra/database";
import type { Repository } from "@stackra/database";
import { MemoryDatabaseDriver } from "@stackra/database/testing";
import { HasPublicId, Model, MovesWithScope } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { ScopeMoved } from "#node/events/scope-moved.event";
import { RepathOnScopeMovedListener } from "#node/listeners/repath-on-scope-moved.listener";

/** A model that follows its scope. */
class Desk extends Model.with(HasPublicId("dsk"), MovesWithScope) {
  scopePath!: string;
}

registerEntities([
  new EntitySchema<Desk>({
    class: Desk,
    schema: "moves",
    tableName: "desks",
    properties: {
      id: { type: "string", primary: true, columnType: "varchar(33)" },
      scopePath: { type: "string", fieldName: "scope_path", columnType: "ltree" },
    } as never,
  }),
]);

/** A new repository of desks on the connected database. */
const desks = () => Reflect.construct(repositoryOf(Desk), []) as Repository<Desk>;

describe(RepathOnScopeMovedListener, { timeout: 60_000 }, () => {
  it("is a queued listener with back-off", () => {
    expect(kindOf(RepathOnScopeMovedListener)).toMatchObject({
      kind: "listener",
      options: { queue: "default", retry: { attempts: 8 } },
    });
  });

  it("re-paths the moved subtree's rows and leaves a sibling put", async () => {
    const database = new MemoryDatabaseDriver();
    try {
      // this package starts PGlite from its own migrations, so the test table is made here
      await database.em().execute("create schema if not exists moves");
      await database
        .em()
        .execute(
          "create table if not exists moves.desks (id varchar(33) primary key, scope_path ltree not null)",
        );
      await database.transaction(async () => {
        await desks().insertMany([
          { id: "dsk_01ja0000000000000000000001", scopePath: "platform.a.shop" },
          { id: "dsk_01ja0000000000000000000002", scopePath: "platform.a.shop.till" },
          { id: "dsk_01ja0000000000000000000003", scopePath: "platform.a.other" },
        ] as never);
      });
      const event = ScopeMoved.create({
        scopeId: "scp_01ja0000000000000000000009",
        from: "platform.a.shop",
        to: "platform.b.shop",
      });
      await database.transaction(() => new RepathOnScopeMovedListener().handle(event));
      const rows = await desks().find({});
      expect(Object.fromEntries(rows.map((row) => [row.id, row.scopePath]))).toEqual({
        dsk_01ja0000000000000000000001: "platform.b.shop",
        dsk_01ja0000000000000000000002: "platform.b.shop.till",
        dsk_01ja0000000000000000000003: "platform.a.other",
      });
    } finally {
      await database.close();
    }
  });
});
