/**
 * Stackra file contract:
 * Purpose: integration tests of `PostgresDatabaseDriver.withScope` on real Postgres over a pool of ONE connection, so
 *          every call shares one backend: after `withScope(X)` returns or throws, the next transaction runs with no
 *          scope settings and sees no row; and a nested `withScope` (a savepoint) puts the enclosing scope settings
 *          back when it returns, throws or grants no scope, while a write it left unflushed lands in its own scope.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers. The container's user is a superuser, which row
 *           security never restricts, so each read runs as `scope_probe` (`set local role`); the seed rows are
 *           written as the superuser. The single-connection driver is this file's own, on the container
 *           `usePostgres` starts.
 * Runtime: node (vitest)
 * Governing contract: ADR 0327 (decisions 3 and 5); ADR 0495; ADR 0182 (integration tier); ADR 0022.
 */
import { EntitySchema } from "@mikro-orm/core";
import type { ScopeRef } from "@stackra/contracts";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";

import { Migration } from "#core/bases/migration.base";
import { Extension } from "#core/enums/extension.enum";
import { compileMigration } from "#core/functions/compile-migration.function";
import type { Blueprint } from "#core/types/blueprint.type";
import type { SchemaBuilder } from "#core/types/schema-builder.type";
import { PostgresDatabaseDriver } from "#node/drivers/postgres-database.driver";
import { usePostgres } from "#testing/use-postgres";

const acme: ScopeRef = { id: "scp_01ja0000000000000000000001", path: "platform.acme" };
const globex: ScopeRef = { id: "scp_01ja0000000000000000000003", path: "platform.globex" };

class Note {
  id!: string;

  scopeId!: string;

  scopePath!: string;

  body!: string;
}

const NoteSchema = new EntitySchema<Note>({
  class: Note,
  schema: "notes",
  tableName: "notes",
  properties: {
    id: { type: "string", primary: true, columnType: "varchar(33)" },
    scopeId: { type: "string", fieldName: "scope_id", columnType: "varchar(33)" },
    scopePath: { type: "string", fieldName: "scope_path", columnType: "ltree" },
    body: { type: "text" },
  },
});

class CreateNotesMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.createExtension(Extension.Ltree);
    schema.create("notes", (t: Blueprint) => {
      t.hasPublicId("note");
      t.scopeId().notNull().comment("The scope node the note belongs to.");
      t.scopePath().notNull().comment("The node's path, denormalised.");
      t.string("body").notNull().comment("The note's text.");
      t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
    });
  }
}

const postgres = usePostgres({
  entities: [NoteSchema],
  migrations: [compileMigration(CreateNotesMigration, { schema: "notes", createsSchema: true })],
});

/** The role every read runs as: no login, no `BYPASSRLS`, not the table's owner. */
const ROLE = "scope_probe";

const state: { database?: PostgresDatabaseDriver } = {};

/** The one-connection database. */
const single = (): PostgresDatabaseDriver => state.database as PostgresDatabaseDriver;

/** The bodies the probe role sees, the scope settings and the backend, read in the running transaction. */
async function look() {
  const em = single().em();
  await em.execute(`set local role ${ROLE}`);
  const rows = (await em.execute("select body from notes.notes order by body")) as {
    body: string;
  }[];
  const [row] = (await em.execute(
    "select coalesce(current_setting('app.scope_id', true), '') as id, coalesce(current_setting('app.scope_path', true), '') as path, coalesce(current_setting('app.scope_paths', true), '') as paths, pg_backend_pid() as pid",
  )) as { id: string; path: string; paths: string; pid: number }[];
  return {
    bodies: rows.map(({ body }) => body),
    settings: { id: row?.id, path: row?.path, paths: row?.paths },
    pid: row?.pid ?? -1,
  };
}

/** What a transaction that enters no scope sees on the connection. */
const outside = () => single().transaction(look);

/** The settings of one scope. */
const settingsOf = (scope: ScopeRef) => ({ id: scope.id, path: scope.path, paths: scope.path });

const NONE = { id: "", path: "", paths: "" };

beforeAll(async () => {
  const em = postgres.database.em();
  await em.execute(`create role ${ROLE} nologin nobypassrls`);
  await em.execute(`grant usage on schema notes to ${ROLE}`);
  await em.execute(`grant select, insert on notes.notes to ${ROLE}`);
  await em.execute(
    "insert into notes.notes (id, scope_id, scope_path, body) values (?, ?, ?, ?), (?, ?, ?, ?)",
    [
      "note_01ja0000000000000000000001",
      acme.id,
      acme.path,
      "a",
      "note_01ja0000000000000000000003",
      globex.id,
      globex.path,
      "g",
    ],
  );
  state.database = await PostgresDatabaseDriver.connect({
    url: postgres.url,
    entities: [NoteSchema],
    pool: { min: 0, max: 1 },
  });
});

afterAll(async () => {
  await state.database?.close();
});

describe("withScope on one pooled connection", () => {
  it("leaves no scope behind once it returns, and the next scope sees only its own rows", async () => {
    const inAcme = await single().withScope(acme, look);
    expect(inAcme).toMatchObject({ bodies: ["a"], settings: settingsOf(acme) });
    expect(await outside()).toEqual({ bodies: [], settings: NONE, pid: inAcme.pid });
    expect(await single().withScope(globex, look)).toEqual({
      bodies: ["g"],
      settings: settingsOf(globex),
      pid: inAcme.pid,
    });
  });

  it("leaves no scope behind when the work throws", async () => {
    const failure = new Error("work failed");
    await expect(
      single().withScope(acme, async () => {
        await look();
        throw failure;
      }),
    ).rejects.toBe(failure);
    expect(await outside()).toMatchObject({ bodies: [], settings: NONE });
  });

  it("puts the enclosing scope back after a nested call returns, throws or grants none", async () => {
    const seen = await single().withScope(acme, async () => {
      const inner = await single().withScope(globex, async () => {
        // left for the savepoint's flush, which must run in globex: the policy's check refuses it anywhere else
        const em = single().em();
        em.persist(
          em.create(Note, {
            id: "note_01ja0000000000000000000004",
            scopeId: globex.id,
            scopePath: globex.path,
            body: "g2",
          }),
        );
        return look();
      });
      const afterReturn = await look();
      await expect(
        single().withScope(globex, async () => {
          await look();
          throw new Error("inner failed");
        }),
      ).rejects.toThrow("inner failed");
      const afterThrow = await look();
      const none = await single().withScope([], look);
      const afterNone = await look();
      return { inner, afterReturn, afterThrow, none, afterNone };
    });
    expect(seen.inner).toMatchObject({ bodies: ["g"], settings: settingsOf(globex) });
    expect(seen.afterReturn).toMatchObject({ bodies: ["a"], settings: settingsOf(acme) });
    expect(seen.afterThrow).toMatchObject({ bodies: ["a"], settings: settingsOf(acme) });
    expect(seen.none).toMatchObject({ bodies: [], settings: NONE });
    expect(seen.afterNone).toMatchObject({ bodies: ["a"], settings: settingsOf(acme) });
    expect(await outside()).toMatchObject({ bodies: [], settings: NONE });
    expect(await single().withScope(globex, look)).toMatchObject({ bodies: ["g", "g2"] });
  });
});
