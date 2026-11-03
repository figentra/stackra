/**
 * Stackra file contract:
 * Purpose: unit tests of `DATABASE_TESTING_PLUGIN`: `.seed(...)` runs each seeder in its own transaction when the
 *          module compiles, a wired seeder with its injected service (STA-1698), `app.transaction(work)` runs work in a transaction of the connected database, a compile
 *          with no database connects a fresh memory one (replacing the one an earlier module left, keeping any other),
 *          and `app.repository(Model)` hands out the model's repository; and every compile connects the app as the
 *          reads' visibility resolver (STA-2044), so on PGlite a read inside a call returns only the rows the bound
 *          `VisibilityFilter` lets through (not another organisation's, not a sibling scope's), a create stamps the call's
 *          actor and the call's time zone is read.
 * Boundary: test only; the database is a stand-in that counts transactions, and the module is an empty one, except
 *           in the visibility case, which runs on PGlite with a stand-in filter of the call's scope node and subtree (the
 *           real one is `@stackra/iam`'s, over row-level security, ADR 0333 decision 5).
 * Runtime: node (vitest)
 * Governing contract: ADR 0269 (decision 3); ADR 0190; ADR 0022.
 */
import type { EntityManager } from "@mikro-orm/postgresql";
import { EntitySchema } from "@mikro-orm/core";
import { ContextStorage, UnitOfWork } from "@stackra/actions/contracts";
import { type AnyClass, Driver, Module } from "@stackra/container";
import { type Actor, ActorKind, Realm, type ScopeRef } from "@stackra/contracts";
import { HasPublicId, Model, UserStamps } from "@stackra/model";
import { createTestingModule, registerWiring } from "@stackra/container/testing";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { CrudService } from "#core/bases/crud-service.base";
import { Seeder } from "#core/bases/seeder.base";
import { VisibilityFilter } from "#contracts/ports/visibility-filter.port";
import type { Where } from "#contracts/types/where.type";
import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { VISIBILITY_HOST } from "#core/constants/visibility-host.constant";
import { callTimeZone } from "#core/functions/call-time-zone.function";
import { registerEntities } from "#core/functions/register-entities.function";
import { repositoryOf } from "#core/functions/repository-of.function";
import type { Repository } from "#core/types/repository.type";
import { modelOf } from "#core/functions/model-of.function";
import { Database } from "#core/ports/database.port";
import { DatabaseUnitOfWorkDriver } from "#node/drivers/database-unit-of-work.driver";
import { DATABASE_TESTING_PLUGIN } from "#testing/constants/database-testing-plugin.constant";
import { MemoryDatabaseDriver } from "#testing/drivers/memory-database.driver";

class CountingDatabase extends Database {
  transactions = 0;

  em(): EntityManager {
    throw new Error("not used");
  }

  async transaction<T>(work: () => Promise<T>): Promise<T> {
    this.transactions += 1;
    return work();
  }

  withScope<T>(_scopes: unknown, work: () => Promise<T>): Promise<T> {
    return work();
  }

  async close(): Promise<void> {
    await Promise.resolve();
  }
}

class FixtureModule extends Module {}

const seeded: string[] = [];

class FirstSeeder extends Seeder {
  async run(): Promise<void> {
    seeded.push("first");
    await Promise.resolve();
  }
}

class SecondSeeder extends Seeder {
  async run(): Promise<void> {
    seeded.push("second");
    await Promise.resolve();
  }
}

class Widget {}

/** A service a seeder injects. */
class Greeter {
  greet(): string {
    return "hello";
  }
}

class GreetingSeeder extends Seeder {
  constructor(private readonly greeter: Greeter) {
    super();
  }

  async run(): Promise<void> {
    seeded.push(this.greeter.greet());
    await Promise.resolve();
  }
}

class WiredModule extends Module {}

registerWiring({
  member: "seeding",
  root: WiredModule,
  bindings: [
    { module: "seeding", provide: Greeter, deps: [] },
    { module: "seeding", provide: GreetingSeeder, deps: [Greeter] },
  ],
});

/** A note kept at a scope node, stamped with who wrote it. */
class Note extends Model.with(HasPublicId("note"), UserStamps) {
  scopePath!: string;

  body!: string;
}

registerEntities([
  new EntitySchema<Note>({
    class: Note,
    schema: "notes",
    tableName: "notes",
    properties: {
      id: { type: "string", primary: true, columnType: "varchar(33)" },
      scopePath: { type: "string" },
      body: { type: "text" },
      createdBy: { type: "string", nullable: true },
      updatedBy: { type: "string", nullable: true },
    },
  }),
]);

const SHOP_A: ScopeRef = { id: "scp_01ja0000000000000000000001", path: "platform.acme.shop_a" };
const SHOP_B: ScopeRef = { id: "scp_01ja0000000000000000000002", path: "platform.acme.shop_b" };
/** Another organisation's shop, under a different node of the scope tree. */
const OTHER: ScopeRef = { id: "scp_01ja0000000000000000000003", path: "platform.globex.shop_a" };
const alice: Actor = {
  kind: ActorKind.User,
  id: "usr_01ja0000000000000000000001",
  realm: Realm.Staff,
};

/** The running call, set by the test. */
class FixedCallDriver extends Driver(ContextStorage) {
  value: object | undefined = undefined;

  run<T>(value: object, work: () => T): T {
    this.value = value;
    return work();
  }

  current(): object | undefined {
    return this.value;
  }
}

/** A stand-in filter: inside a call, only the call's scope node and its subtree; outside one, every row. */
class ScopeFilterDriver extends Driver(VisibilityFilter) {
  constructor(private readonly calls: FixedCallDriver) {
    super();
  }

  async conditionsFor<M extends object>(_model: AnyClass<M>): Promise<Where<M>> {
    const call = this.calls.current() as { scope: ScopeRef } | undefined;
    await Promise.resolve();
    if (call === undefined) return {} as Where<M>;
    const { path } = call.scope;
    return { $or: [{ scopePath: path }, { scopePath: { $like: `${path}.%` } }] } as Where<M>;
  }
}

/** A new repository of notes on the connected database. */
const notes = () => Reflect.construct(repositoryOf(Note), []) as Repository<Note>;

afterEach(async () => {
  await ACTIVE_DATABASE.current?.close();
  ACTIVE_DATABASE.current = undefined;
});

describe("DATABASE_TESTING_PLUGIN", () => {
  it("seeds in order, each in a transaction, and adds app.transaction", async () => {
    const database = new CountingDatabase();
    ACTIVE_DATABASE.current = database;
    const app = await createTestingModule(FixtureModule).seed(FirstSeeder, SecondSeeder).compile();
    expect(DATABASE_TESTING_PLUGIN.name).toBe("@stackra/database");
    expect(seeded).toEqual(["first", "second"]);
    expect(database.transactions).toBe(2);
    expect(await app.transaction(async () => "done")).toBe("done");
    expect(database.transactions).toBe(3);
  });

  it("takes a wired seeder from the container, its injected service included", async () => {
    seeded.length = 0;
    ACTIVE_DATABASE.current = new CountingDatabase();
    await createTestingModule(WiredModule).seed(GreetingSeeder).compile();
    expect(seeded).toEqual(["hello"]);
  });

  it("connects a fresh memory database per module and keeps one connected another way", async () => {
    await createTestingModule(FixtureModule).compile();
    const first = Database.current();
    expect(first).toBeInstanceOf(MemoryDatabaseDriver);
    await createTestingModule(FixtureModule).compile();
    expect(Database.current()).toBeInstanceOf(MemoryDatabaseDriver);
    expect(Database.current()).not.toBe(first);

    const counting = new CountingDatabase();
    ACTIVE_DATABASE.current = counting;
    await createTestingModule(FixtureModule).compile();
    await createTestingModule(FixtureModule).compile();
    expect(Database.current()).toBe(counting);
  });

  it("runs actions in a transaction of the connected database when the test picks memory (STA-1701)", async () => {
    const counting = new CountingDatabase();
    ACTIVE_DATABASE.current = counting;
    const app = await createTestingModule(FixtureModule).useDrivers("memory").compile();
    const unit = app.get(UnitOfWork);
    expect(unit).toBeInstanceOf(DatabaseUnitOfWorkDriver);
    await expect(unit.transaction(() => Promise.resolve("done"))).resolves.toBe("done");
    expect(counting.transactions).toBe(1);
  });

  it(
    "connects the app as the visibility resolver: a read in a call keeps to its scope subtree, a create stamps its actor, its time zone is read (STA-2044)",
    { timeout: 60_000 },
    async () => {
      const calls = new FixedCallDriver();
      const app = await createTestingModule(FixtureModule)
        .override(ContextStorage, calls)
        .override(VisibilityFilter, new ScopeFilterDriver(calls))
        .compile();
      expect(VISIBILITY_HOST.resolver).toBe(app);
      // Seeded outside a call: the platform's own code sees and writes every row, and stamps no principal.
      await app.transaction(async () => {
        notes().create({
          id: "note_01ja0000000000000000000001",
          scopePath: SHOP_A.path,
          body: "acme, shop a",
        });
        notes().create({
          id: "note_01ja0000000000000000000002",
          scopePath: SHOP_B.path,
          body: "acme, shop b",
        });
        notes().create({
          id: "note_01ja0000000000000000000003",
          scopePath: OTHER.path,
          body: "globex, shop a",
        });
      });
      expect(await notes().count({})).toBe(3);

      calls.value = { actor: alice, scope: SHOP_A, timeZone: "Asia/Riyadh" };
      expect((await notes().find({})).map((note) => note.body)).toEqual(["acme, shop a"]);
      expect(await notes().count({})).toBe(1);
      // A sibling scope's row and another organisation's row are not found, even by id.
      expect(await notes().findOne({ id: "note_01ja0000000000000000000002" })).toBeNull();
      expect(await notes().findOne({ id: "note_01ja0000000000000000000003" })).toBeNull();

      await app.transaction(async () => {
        notes().create({
          id: "note_01ja0000000000000000000004",
          scopePath: SHOP_A.path,
          body: "by alice",
        });
      });
      const written = await notes().findOneOrFail({ id: "note_01ja0000000000000000000004" });
      expect([written.createdBy, written.updatedBy]).toEqual([alice.id, alice.id]);
      expect(callTimeZone()).toBe("Asia/Riyadh");

      calls.value = undefined;
      const system = await notes().findOneOrFail({ id: "note_01ja0000000000000000000001" });
      expect(system.createdBy).toBeNull();
      expect(callTimeZone()).toBe("UTC");
    },
  );

  it("hands out the model's repository", async () => {
    const app = await createTestingModule(FixtureModule).compile();
    const widgets = app.repository(Widget);
    expect(widgets).toBeInstanceOf(CrudService);
    expect(modelOf(widgets.constructor)).toBe(Widget);
  });
});
