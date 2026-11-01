/**
 * Stackra file contract:
 * Purpose: unit tests of `runSeeders` and `runSeedEntry`: a profile runs `minimal` first, each seeder in its own
 *          transaction with its ledger row, built by the booted container (a seeder that injects a service gets it); an
 *          unchanged seeder is skipped, `again` runs it anyway; `module` narrows the run; a failing seeder stops the run
 *          and is named; an unknown profile is refused; the entry prints the run and answers 1 on a failure.
 * Boundary: test only; the database is a stand-in that counts transactions, the ledger a map; the SQL ledger is
 *           covered by the gate's Postgres tier.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0190; ADR 0325 (decision 7); STA-1698; STA-1709.
 */
import type { EntityManager } from "@mikro-orm/postgresql";
import { Module } from "@stackra/container";
import { createTestingModule, registerWiring } from "@stackra/container/testing";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { Seeder } from "#core/bases/seeder.base";
import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { Database } from "#core/ports/database.port";
import { runSeedEntry } from "#node/functions/run-seed-entry.function";
import { runSeeders } from "#node/functions/run-seeders.function";
import type { SeedLedger } from "#node/types/seed-ledger.type";
import type { SeederEntry } from "#node/types/seeder-entry.type";

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

const seeded: string[] = [];

/** A service a seeder injects. */
class Settings {
  pack(): string {
    return "settings";
  }
}

class OrdersMinimalSeeder extends Seeder {
  constructor(private readonly settings: Settings) {
    super();
  }

  async run(): Promise<void> {
    seeded.push(`orders.minimal:${this.settings.pack()}`);
    await Promise.resolve();
  }
}

class OrdersDemoSeeder extends Seeder {
  async run(): Promise<void> {
    seeded.push("orders.demo");
    await Promise.resolve();
  }
}

class CatalogMinimalSeeder extends Seeder {
  async run(): Promise<void> {
    seeded.push("catalog.minimal");
    await Promise.resolve();
  }
}

class BrokenTestSeeder extends Seeder {
  async run(): Promise<void> {
    await Promise.resolve();
    throw new Error("duplicate key");
  }
}

class SeedingModule extends Module {}

registerWiring({
  member: "seeding",
  root: SeedingModule,
  bindings: [
    { module: "seeding", provide: Settings, deps: [] },
    { module: "seeding", provide: OrdersMinimalSeeder, deps: [Settings] },
  ],
});

const SEEDERS: readonly SeederEntry[] = [
  { key: "orders.minimal", module: "orders", profile: "minimal", type: OrdersMinimalSeeder },
  { key: "orders.demo", module: "orders", profile: "demo", type: OrdersDemoSeeder },
  { key: "catalog.minimal", module: "catalog", profile: "minimal", type: CatalogMinimalSeeder },
  { key: "orders.test", module: "orders", profile: "test", type: BrokenTestSeeder },
];

/** A ledger in a map, recording who ran each seeder. */
function memoryLedger(): SeedLedger & {
  readonly rows: Map<string, string>;
  readonly by: string[];
} {
  const rows = new Map<string, string>();
  const by: string[] = [];
  return {
    rows,
    by,
    applied: async () => {
      await Promise.resolve();
      return new Map(rows);
    },
    record: async (_member, run) => {
      await Promise.resolve();
      rows.set(run.key, run.checksum);
      by.push(run.ranBy);
    },
  };
}

let database: CountingDatabase;

beforeEach(() => {
  seeded.length = 0;
  database = new CountingDatabase();
  ACTIVE_DATABASE.current = database;
});

afterEach(() => {
  ACTIVE_DATABASE.current = undefined;
});

describe(runSeeders, () => {
  it("runs minimal first, each seeder in a transaction, built by the container", async () => {
    const container = await createTestingModule(SeedingModule).compile();
    const ledger = memoryLedger();
    const base = { container, member: "seeding", seeders: SEEDERS, ledger, ranBy: "ci" };
    const result = await runSeeders({ ...base, profile: "demo" });
    expect(result).toEqual({
      ran: ["orders.minimal", "catalog.minimal", "orders.demo"],
      skipped: [],
    });
    expect(seeded).toEqual(["orders.minimal:settings", "catalog.minimal", "orders.demo"]);
    expect(database.transactions).toBe(3);
    expect(ledger.by).toEqual(["ci", "ci", "ci"]);
  });

  it("skips an unchanged seeder, runs it again with `again`, and narrows to one module", async () => {
    const container = await createTestingModule(SeedingModule).compile();
    const ledger = memoryLedger();
    const base = { container, member: "seeding", seeders: SEEDERS, ledger, ranBy: "ci" };
    await runSeeders({ ...base, profile: "minimal" });
    expect(await runSeeders({ ...base, profile: "minimal" })).toEqual({
      ran: [],
      skipped: ["orders.minimal", "catalog.minimal"],
    });
    expect(
      await runSeeders({ ...base, profile: "minimal", again: true, module: "catalog" }),
    ).toEqual({
      ran: ["catalog.minimal"],
      skipped: [],
    });
    ledger.rows.set("orders.minimal", "an older source");
    expect((await runSeeders({ ...base, profile: "minimal" })).ran).toEqual(["orders.minimal"]);
  });

  it("stops at a failing seeder and names it, and refuses an unknown profile", async () => {
    const container = await createTestingModule(SeedingModule).compile();
    const base = {
      container,
      member: "seeding",
      seeders: SEEDERS,
      ledger: memoryLedger(),
      ranBy: "ci",
    };
    await expect(runSeeders({ ...base, profile: "test" })).rejects.toThrow(
      "seeder orders.test failed (2 ran before it): duplicate key",
    );
    await expect(runSeeders({ ...base, profile: "staging" })).rejects.toThrow(RangeError);
  });
});

describe(runSeedEntry, () => {
  it("reads the arguments, prints the run and answers 1 on a failure", async () => {
    const container = await createTestingModule(SeedingModule).compile();
    const out: string[] = [];
    const err: string[] = [];
    const entry = {
      container,
      member: "seeding",
      seeders: SEEDERS,
      ledger: memoryLedger(),
      out: (text: string) => void out.push(text),
      err: (text: string) => void err.push(text),
    };
    expect(await runSeedEntry({ ...entry, argv: ["--module", "orders", "--ran-by", "rana"] })).toBe(
      0,
    );
    expect(out.join("")).toBe(
      "db seed (minimal): ran 1, skipped 0 unchanged\n  ran      orders.minimal\n",
    );
    expect(await runSeedEntry({ ...entry, argv: ["--profile", "test"] })).toBe(1);
    expect(err.join("")).toContain("seeder orders.test failed");
  });
});
