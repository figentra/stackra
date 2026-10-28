/**
 * Stackra file contract:
 * Purpose: unit tests of `Search`: a service whose `in(Model)` gives that model's `SearchIndex` over the injected driver
 *          and database, refuses a model without `@Searchable`, and `across` fuses
 *          several models' results by rank, applies each model's own filters (and refuses a path its facet does not
 *          list), and passes the Arabizi switch through.
 * Boundary: test only; the database is a stand-in that is never reached.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0221; ADR 0294 (decision 16); STA-1251.
 */
import { Service } from "@stackra/container";
import type { Database } from "@stackra/database";
import { Model, Searchable } from "@stackra/model";
import { MemorySettingValueStoreDriver, SettingsReader } from "@stackra/settings";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { MemorySearchDriver } from "#core/drivers/memory-search.driver";
import { Search } from "#core/services/search.service";
import type { SearchHit } from "#core/types/search-hit.type";
import { SearchIndex } from "#core/values/search-index.value";

@Searchable({ text: ["target"] })
class Entry extends Model.with() {}

class Plain extends Model.with() {}

const settings = new SettingsReader(new MemorySettingValueStoreDriver());

const search = new Search(new MemorySearchDriver(), {} as Database, settings);

describe(Search, () => {
  it("is a service", () => {
    expect(search).toBeInstanceOf(Service);
  });

  it("gives the index of a searchable model", () => {
    expect(search.in(Entry)).toBeInstanceOf(SearchIndex);
  });

  it("refuses a model without @Searchable", () => {
    expect(() => search.in(Plain)).toThrow(TypeError);
  });
});

/** Each hit as `[model, id]`. */
const pairs = (hits: readonly SearchHit[]) =>
  hits.map((hit) => [hit.model, (hit.row as { id: string }).id]);

describe("Search.across", () => {
  @Searchable({
    text: ["name"],
    filters: ["tier"],
  })
  class Customer extends Model.with() {
    id = "";

    name = "";

    tier = "";
  }

  @Searchable({ text: ["title"] })
  class Matter extends Model.with() {
    id = "";

    title = "";
  }

  const ROWS = [
    Object.assign(new Customer(), { id: "cus_1", name: "Acme Trading", tier: "gold" }),
    Object.assign(new Customer(), { id: "cus_2", name: "Acme Holdings", tier: "silver" }),
    Object.assign(new Matter(), { id: "mat_1", title: "Acme v. Gulf" }),
  ];

  /** A `Search` over the memory driver with ROWS indexed. */
  async function indexed(): Promise<Search> {
    const em = {
      getMetadata: (model: { name: string }) => ({
        tableName: model.name.toLowerCase(),
        primaryKeys: ["id"],
        properties: { id: { kind: "scalar", fieldNames: ["id"] } },
      }),
      populate: async () => undefined,
      // outside a scope session: no granted paths
      execute: async () => [{ paths: null }],
      find: async (model: unknown, where: { id?: { $in?: readonly string[] } }) =>
        ROWS.filter(
          (row) =>
            row instanceof (model as new () => object) && (where.id?.$in?.includes(row.id) ?? true),
        ),
    };
    const global = new Search(
      new MemorySearchDriver(),
      { em: () => em } as unknown as Database,
      settings,
    );
    await global.in(Customer).index(ROWS.slice(0, 2) as Customer[]);
    await global.in(Matter).index(ROWS.slice(2) as Matter[]);
    return global;
  }

  it("fuses each model's best rows by rank, up to the limit", async () => {
    const global = await indexed();
    const hits = await global.across([Customer, Matter], "acme", { limit: 2 });
    expect(pairs(hits)).toEqual([
      [Customer, "cus_1"],
      [Matter, "mat_1"],
    ]);
  });

  it("applies each model's own filters and leaves a model without an entry unfiltered", async () => {
    const global = await indexed();
    const hits = await global.across([Customer, Matter], "acme", {
      filters: new Map([[Customer, { tier: "silver" }]]),
    });
    expect(pairs(hits)).toEqual([
      [Customer, "cus_2"],
      [Matter, "mat_1"],
    ]);
  });

  it("refuses a filter path the model's facet does not list", async () => {
    const global = await indexed();
    await expect(
      global.across([Matter], "acme", { filters: new Map([[Matter, { tier: "gold" }]]) }),
    ).rejects.toThrow(TypeError);
  });

  it("passes the Arabizi switch to every index", async () => {
    const global = await indexed();
    const find = vi.spyOn(SearchIndex.prototype, "find");
    await global.across([Customer, Matter], "7abibi", { arabizi: false, locale: "ar-SA" });
    expect(find.mock.calls.map((call) => call[1])).toEqual([
      { limit: 20, filters: undefined, locale: "ar-SA", arabizi: false },
      { limit: 20, filters: undefined, locale: "ar-SA", arabizi: false },
    ]);
    find.mockRestore();
  });
});
