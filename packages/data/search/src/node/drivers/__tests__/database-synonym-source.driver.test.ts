/**
 * Stackra file contract:
 * Purpose: unit tests of `DatabaseSynonymSourceDriver`: it reads `Synonym` rows of the asked indexes (and language when
 *          given) oldest first through the running entity manager, adds no tenant filter of its own, and returns them as
 *          `SynonymSet`s.
 * Boundary: test only; a stand-in entity manager records the query and answers fixed rows, so no database runs. Tenant
 *           isolation is the database's policy, proved by the integration tier.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0492 (decision 5); ADR 0327 (decision 9).
 */
import type { Database } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SynonymSource } from "#contracts/index";
import { DatabaseSynonymSourceDriver } from "#node/drivers/database-synonym-source.driver";
import { Synonym } from "#node/models/synonym.model";

describe(DatabaseSynonymSourceDriver, () => {
  it("reads the asked indexes' rows, oldest first, with no tenant filter of its own", async () => {
    const find = vi.fn(async () => [
      Object.assign(new Synonym(), { indexName: "products", language: "en", terms: ["a", "b"] }),
    ]);
    const database = { em: () => ({ find }) } as unknown as Database;
    const source = new DatabaseSynonymSourceDriver(database);
    expect(source).toBeInstanceOf(SynonymSource);
    expect(await source.setsOf(["products", "shop.products"])).toEqual([
      { index: "products", language: "en", terms: ["a", "b"] },
    ]);
    expect(find).toHaveBeenCalledWith(
      Synonym,
      { indexName: { $in: ["products", "shop.products"] } },
      { orderBy: { createdAt: "asc", id: "asc" } },
    );
    await source.setsOf(["products"], "ar");
    expect(find.mock.calls[1]?.[1]).toEqual({ indexName: { $in: ["products"] }, language: "ar" });
  });
});
