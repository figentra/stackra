/**
 * Stackra file contract:
 * Purpose: unit tests of `planSeed`: a record the store lacks is inserted, a seed-owned record with other content is
 *          updated, a current one is left, and a record a tenant changed is kept whatever the seed says.
 * Boundary: test only; pure values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); config-model sections 3 and 6.
 */
import { describe, expect, it } from "@stackra/testing";

import { planSeed } from "#node/functions/plan-seed.function";
import { seedRecordHash } from "#node/functions/seed-record-hash.function";
import type { SeedRecord } from "#node/types/seed-record.type";

/** A one-row settings record. */
const record = (key: string, value: number): SeedRecord => ({
  kind: "settings",
  key,
  profile: "minimal",
  file: `profiles/minimal/${key}.yaml`,
  rows: [{ id: "value", answer: "COM-160", value }],
});

describe("planSeed", () => {
  it("inserts, updates, leaves and keeps", () => {
    const current = record("current", 1);
    const plan = planSeed(
      [record("new", 1), record("changed", 2), current, record("tenant", 9)],
      [
        {
          kind: "settings",
          key: "changed",
          owner: "seed",
          hash: seedRecordHash(record("changed", 1)),
        },
        { kind: "settings", key: "current", owner: "seed", hash: seedRecordHash(current) },
        { kind: "settings", key: "tenant", owner: "tenant", hash: "edited" },
      ],
    );
    expect(plan.insert.map((item) => item.key)).toEqual(["new"]);
    expect(plan.update.map((item) => item.key)).toEqual(["changed"]);
    expect(plan.update[0]?.hash).toBe(seedRecordHash(record("changed", 2)));
    expect(plan.unchanged).toEqual(["settings:current"]);
    expect(plan.kept).toEqual(["settings:tenant"]);
  });
});
