/**
 * Stackra file contract:
 * Purpose: unit tests of `Search`: a service whose `in(Model)` gives that model's `SearchIndex` over the injected driver
 *          and database, and refuses a model without `@Searchable`.
 * Boundary: test only; the database is a stand-in that is never reached.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0221; ADR 0294 (decision 16).
 */
import { Service } from "@stackra/container";
import type { Database } from "@stackra/database";
import { Model, Searchable } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { MemorySearchDriver } from "#core/drivers/memory-search.driver";
import { Search } from "#core/services/search.service";
import { SearchIndex } from "#core/values/search-index.value";

@Searchable({ text: ["target"] })
class Entry extends Model.with() {}

class Plain extends Model.with() {}

const search = new Search(new MemorySearchDriver(), {} as Database);

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
