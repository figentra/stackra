/**
 * Stackra file contract:
 * Purpose: unit tests of `Extension` and `Aggregate`: exactly the five ADR 0160 extensions plus PostGIS (ADR 0314) by their SQL names, and the
 *          two aggregates a metrics series takes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0160 (decision 2); ADR 0314 (decision 1); ADR 0307 (rule 16); ADR 0022; ADR 0269.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Aggregate } from "#core/enums/aggregate.enum";
import { Extension } from "#core/enums/extension.enum";

describe("Extension", () => {
  it("lists the approved extensions only", () => {
    expect(Enum.values(Extension)).toEqual([
      "vector",
      "pg_trgm",
      "ltree",
      "citext",
      "pgcrypto",
      "postgis",
    ]);
    expect(Enum.values(Extension)).not.toContain("timescaledb");
  });

  it("lists the aggregates", () => {
    expect(Enum.values(Aggregate)).toEqual(["count", "sum"]);
  });
});
