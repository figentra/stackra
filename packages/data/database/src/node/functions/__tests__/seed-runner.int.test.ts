/**
 * Stackra file contract:
 * Purpose: integration tests of the seed runner, `seedState` and `applySeed`, on real Postgres: a run writes new
 *          records and answers their `kind:key`, the state reports them with their hash, a rerun updates a seed-owned
 *          record, and a record someone changed (`owner = tenant`) is never overwritten, even by a stale plan.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers; the compiled 0003 migration creates the ledger
 *           and `DATABASE_URL` points the runner at the container for the file.
 * Runtime: node (vitest)
 * Governing contract: ADR 0396 (decision 1); ADR 0325 (decision 7); ADR 0022; ADR 0269.
 */
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";

import { compileMigration } from "#core/functions/compile-migration.function";
import { CreateSeedRecordsMigration } from "#node/database/migrations/0003-create-seed-records.migration";
import { applySeed } from "#node/functions/apply-seed.function";
import { seedState } from "#node/functions/seed-state.function";
import { usePostgres } from "#testing/use-postgres.fixture";

const postgres = usePostgres({
  entities: [],
  migrations: [
    compileMigration(CreateSeedRecordsMigration, { schema: "database", createsSchema: true }),
  ],
});

const previous = process.env["DATABASE_URL"];
beforeAll(() => {
  process.env["DATABASE_URL"] = postgres.url;
});
afterAll(() => {
  if (previous === undefined) delete process.env["DATABASE_URL"];
  else process.env["DATABASE_URL"] = previous;
});

const base = { cwd: ".", environment: "test", pack: "seed-pack:commerce" } as const;
const returns = {
  kind: "settings",
  key: "returns",
  rows: [{ id: "refund-window-days", answer: "COM-160", value: 14 }],
};

describe("seed runner", () => {
  it("writes new records, reports them, and updates a seed-owned one", async () => {
    expect(
      await applySeed({
        ...base,
        version: "1.0.0",
        profile: "minimal",
        records: [{ ...returns, hash: "h1" }],
      }),
    ).toEqual({ written: ["settings:returns"] });
    expect(await seedState(base)).toEqual([
      { kind: "settings", key: "returns", owner: "seed", hash: "h1" },
    ]);
    await applySeed({
      ...base,
      version: "1.1.0",
      profile: "minimal",
      records: [{ ...returns, hash: "h2" }],
    });
    expect((await seedState(base))[0]?.hash).toBe("h2");
  });

  it("never overwrites a record someone changed", async () => {
    const { database } = postgres;
    await database.transaction(async () => {
      await database
        .em()
        .execute(
          `update "database"."seed_records" set owner = 'tenant' where kind = 'settings' and key = 'returns'`,
        );
    });
    expect(
      await applySeed({
        ...base,
        version: "2.0.0",
        profile: "minimal",
        records: [{ ...returns, hash: "h3" }],
      }),
    ).toEqual({ written: [] });
    expect(await seedState(base)).toEqual([
      { kind: "settings", key: "returns", owner: "tenant", hash: "h2" },
    ]);
  });
});
