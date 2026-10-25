/**
 * Stackra file contract:
 * Purpose: unit tests of `seedRecordsFor`: `minimal` alone, `demo` and `test` after `minimal`, an unknown profile
 *          refused.
 * Boundary: test only; pure values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0190 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { seedRecordsFor } from "#node/functions/seed-records-for.function";
import type { SeedPack } from "#node/types/seed-pack.type";

const PACK: SeedPack = {
  key: "seed-pack:commerce",
  product: "commerce",
  version: "1.0.0",
  records: ["demo", "minimal", "test"].map((profile) => ({
    kind: "settings",
    key: profile,
    profile,
    file: `profiles/${profile}/a.yaml`,
    rows: [],
  })),
};

describe("seedRecordsFor", () => {
  it("loads the layers of each profile in order", () => {
    expect(seedRecordsFor(PACK, "minimal").map((record) => record.key)).toEqual(["minimal"]);
    expect(seedRecordsFor(PACK, "demo").map((record) => record.key)).toEqual(["minimal", "demo"]);
    expect(seedRecordsFor(PACK, "test").map((record) => record.key)).toEqual(["minimal", "test"]);
  });

  it("refuses another profile", () => {
    expect(() => seedRecordsFor(PACK, "staging")).toThrow(CliUsageError);
  });
});
