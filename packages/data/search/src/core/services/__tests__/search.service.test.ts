/**
 * Stackra file contract:
 * Purpose: unit tests of `Search`: a service whose `in(Model)` gives that model's `SearchIndex` over the injected driver
 *          and database, refuses a model without `@Searchable`, and `across` fuses
 *          several models' results by rank.
 * Boundary: test only; the database is a stand-in that is never reached.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0221; ADR 0294 (decision 16).
 */
import { Service } from "@stackra/container";
import type { Database } from "@stackra/database";
import { Model, Searchable } from "@stackra/model";
import { MemorySettingValueStoreDriver, SettingsReader } from "@stackra/settings";
import { describe, expect, it } from "@stackra/testing";

import { MemorySearchDriver } from "#core/drivers/memory-search.driver";
import { Search } from "#core/services/search.service";
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

describe("Search.across", () => {
  @Searchable({ text: ["name"] })
  class Customer extends Model.with() {
    id = "";

    name = "";
  }

  @Searchable({ text: ["title"] })
  class Matter extends Model.with() {
    id = "";

    title = "";
  }

  const ROWS = [
    Object.assign(new Customer(), { id: "cus_1", name: "Acme Trading" }),
    Object.assign(new Customer(), { id: "cus_2", name: "Acme Holdings" }),
    Object.assign(new Matter(), { id: "mat_1", title: "Acme v. Gulf" }),
  ];

  it("fuses each model's best rows by rank, up to the limit", async () => {
    const em = {
      getMetadata: (model: { name: string }) => ({
        tableName: model.name.toLowerCase(),
        primaryKeys: ["id"],
        properties: { id: { kind: "scalar", fieldNames: ["id"] } },
      }),
      populate: async () => undefined,
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
    const hits = await global.across([Customer, Matter], "acme", { limit: 2 });
    expect(hits.map((hit) => [hit.model, (hit.row as { id: string }).id])).toEqual([
      [Customer, "cus_1"],
      [Matter, "mat_1"],
    ]);
  });
});
