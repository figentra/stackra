/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryDatabaseDriver` on PGlite: building it connects it, the schema comes from the
 *          registered entities (or from the member's compiled migrations when `.stackra/migrations` exists), a
 *          repository writes in a transaction and reads back, a failed transaction rolls back, `withScope` sets the
 *          scope settings, the `ltree` extension is there, and `close` disconnects it and drops the data.
 * Boundary: unit tier: PGlite runs in this process, no Docker. The working directory is stubbed for the migration case.
 * Runtime: node (vitest)
 * Governing contract: ADR 0266 (memory first); ADR 0159; ADR 0160; ADR 0022; ADR 0269.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { EntitySchema } from "@mikro-orm/core";
import type { ScopeRef } from "@stackra/contracts";
import { HasPublicId, Model } from "@stackra/model";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { registerEntities } from "#core/functions/register-entities.function";
import { repositoryOf } from "#core/functions/repository-of.function";
import { Database } from "#core/ports/database.port";
import type { Repository } from "#core/types/repository.type";
import { MemoryDatabaseDriver } from "#testing/drivers/memory-database.driver";

class Memo extends Model.with(HasPublicId("memo")) {
  body!: string;
}

registerEntities([
  new EntitySchema<Memo>({
    class: Memo,
    schema: "memos",
    tableName: "memos",
    properties: {
      id: { type: "string", primary: true, columnType: "varchar(33)" },
      body: { type: "text" },
    },
  }),
]);

const shop: ScopeRef = { id: "scp_01ja0000000000000000000002", path: "platform.acme.shop_eu" };

/** A new repository of memos on the connected database. */
const memos = () => Reflect.construct(repositoryOf(Memo), []) as Repository<Memo>;

/** The real working directory, put back after the migration case stubs it. */
const cwd = process.cwd.bind(process);

afterEach(async () => {
  process.cwd = cwd;
  await ACTIVE_DATABASE.current?.close();
});

describe(MemoryDatabaseDriver, () => {
  it("connects when built and creates the schema from the registered entities", async () => {
    const database = new MemoryDatabaseDriver();
    expect(Database.current()).toBe(database);
    await database.transaction(async () => {
      memos().create({ id: "memo_01ja0000000000000000000001", body: "hello" });
    });
    expect(await memos().count({})).toBe(1);
    expect((await memos().findOneOrFail({ id: "memo_01ja0000000000000000000001" })).body).toBe(
      "hello",
    );
  });

  it("rolls back a failed transaction", async () => {
    const database = new MemoryDatabaseDriver();
    await expect(
      database.transaction(async () => {
        await memos().insert({ id: "memo_01ja0000000000000000000002", body: "gone" });
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(await memos().count({})).toBe(0);
  });

  it("sets the scope settings inside withScope and has the ltree extension", async () => {
    const database = new MemoryDatabaseDriver();
    const rows = await database.withScope(shop, () =>
      database
        .em()
        .execute<{ id: string; path: string; ancestor: boolean }[]>(
          "select current_setting('app.scope_id') as id, current_setting('app.scope_path') as path, 'platform.acme'::ltree @> current_setting('app.scope_path')::ltree as ancestor",
        ),
    );
    expect(rows[0]).toEqual({ id: shop.id, path: shop.path, ancestor: true });
  });

  it("applies the member's compiled migrations when it has them", async () => {
    const root = mkdtempSync(join(tmpdir(), "stackra-memory-db-"));
    mkdirSync(join(root, ".stackra", "migrations"), { recursive: true });
    writeFileSync(
      join(root, ".stackra", "migrations", "0001_create_memos_1.up.sql"),
      "create schema memos; create table memos.memos (id varchar(33) primary key, body text not null check (body <> ''));",
    );
    process.cwd = () => root;
    const database = new MemoryDatabaseDriver();
    expect(Database.current()).toBe(database);
    await expect(
      memos().insert({ id: "memo_01ja0000000000000000000003", body: "" }),
    ).rejects.toThrow();
    expect(await memos().count({})).toBe(0);
  });

  it("disconnects on close and starts empty when built again", async () => {
    const first = new MemoryDatabaseDriver();
    await memos().insert({ id: "memo_01ja0000000000000000000004", body: "kept?" });
    await first.close();
    expect(() => Database.current()).toThrow("No database is connected");
    const database = new MemoryDatabaseDriver();
    expect(Database.current()).toBe(database);
    expect(await memos().count({})).toBe(0);
  });
});
