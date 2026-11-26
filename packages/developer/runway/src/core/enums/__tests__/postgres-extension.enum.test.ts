/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresExtension` and `APPROVED_POSTGRES_EXTENSIONS`: the eight approved extensions of
 *          ADR 0160 by their SQL names, and the frozen list in the same order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0160 (decision 2 and its notes).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { APPROVED_POSTGRES_EXTENSIONS } from "#core/constants/approved-postgres-extensions.constant";
import { PostgresExtension } from "#core/enums/postgres-extension.enum";

describe("PostgresExtension", () => {
  it("keeps the SQL names ADR 0160 approves", () => {
    expect(Enum.values(PostgresExtension)).toEqual([
      "vector",
      "pg_trgm",
      "ltree",
      "citext",
      "pgcrypto",
      "postgis",
      "pg_stat_statements",
      "btree_gist",
    ]);
  });

  it("lists the same names, frozen", () => {
    expect(APPROVED_POSTGRES_EXTENSIONS).toEqual(Enum.values(PostgresExtension));
    expect(Object.isFrozen(APPROVED_POSTGRES_EXTENSIONS)).toBe(true);
  });
});
