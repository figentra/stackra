/**
 * Stackra file contract:
 * Purpose: unit tests of `SearchIndexRegistry`: every statement binds its values; `list` reads rows back into statuses
 *          (scope, cursor and rebuild time only when stored); `invalidateChanged` names the models whose facet changed
 *          and refuses a model that is not `@Searchable`; `begin` records the version it builds and keeps a stopped rebuild's cursor only for the same
 *          facet and answers it; `progress` and `finish` record the run.
 * Boundary: test only; a stand-in entity manager records each statement and answers fixed rows, so no database runs.
 *           The SQL itself runs in the integration tier.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0404 (decision 3); ADR 0160.
 */
import type { Database } from "@stackra/database";
import { Model, Searchable } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { SearchIndexState } from "#core/enums/search-index-state.enum";
import { searchFacetHashOf } from "#node/functions/search-facet-hash-of.function";
import { SearchIndexRegistry } from "#node/services/search-index-registry.service";

@Searchable({
  text: ["title"],
  filters: ["status"],
})
class Product extends Model.with() {}

class Note extends Model.with() {}

/** One recorded statement. */
interface Statement {
  readonly sql: string;
  readonly params: readonly unknown[];
}

/** A registry whose entity manager records each statement and answers `rows`. */
function registryWith(rows: readonly object[] = []) {
  const statements: Statement[] = [];
  const em = {
    execute: async (sql: string, params: readonly unknown[] = []) => {
      statements.push({ sql, params });
      return rows;
    },
  };
  return {
    registry: new SearchIndexRegistry({ em: () => em } as unknown as Database),
    statements,
  };
}

/** Asserts every statement binds its values: one placeholder per parameter. */
function expectBound(statements: readonly Statement[]): void {
  for (const statement of statements) {
    expect(statement.sql.split("?")).toHaveLength(statement.params.length + 1);
    expect(statement.sql).not.toContain("Product");
  }
}

const scope = { id: "scp_1", path: "platform.acme" } as const;

describe(SearchIndexRegistry, () => {
  it("lists every index as its status", async () => {
    const rebuiltAt = new Date(Date.UTC(2026, 9, 28));
    const { registry } = registryWith([
      {
        model: "Product",
        scope_id: "scp_1",
        scope_path: "platform.acme",
        state: "rebuilding",
        facet_hash: "abc",
        doc_count: 500,
        cursor: "prd_500",
        rebuilt_at: rebuiltAt,
        version: 2,
      },
      {
        model: "Product",
        scope_id: null,
        scope_path: null,
        state: "valid",
        facet_hash: "abc",
        doc_count: 3,
        cursor: null,
        rebuilt_at: null,
        version: null,
      },
    ]);
    expect(await registry.list()).toEqual([
      {
        model: "Product",
        scope,
        state: SearchIndexState.Rebuilding,
        facetHash: "abc",
        docCount: 500,
        cursor: "prd_500",
        rebuiltAt,
        version: 2,
      },
      { model: "Product", state: SearchIndexState.Valid, facetHash: "abc", docCount: 3 },
    ]);
  });

  it("marks invalid the indexes whose facet changed", async () => {
    const { registry, statements } = registryWith([{ model: "Product" }]);
    expect(await registry.invalidateChanged([Product])).toEqual(["Product"]);
    expect(statements[0]?.params).toEqual([
      "Product",
      searchFacetHashOf({ text: ["title"], filters: ["status"] }),
    ]);
    expect(statements[0]?.sql).toContain("state <> 'rebuilding'");
    expectBound(statements);
    await expect(registry.invalidateChanged([Note])).rejects.toThrow(TypeError);
    const unchanged = registryWith([]);
    expect(await unchanged.registry.invalidateChanged([Product])).toEqual([]);
  });

  it("begins a rebuild and answers the cursor of a stopped one with the same facet", async () => {
    const resumed = registryWith([{ cursor: "prd_500", doc_count: 500 }]);
    expect(await resumed.registry.begin("Product", scope, "abc")).toEqual({
      cursor: "prd_500",
      docCount: 500,
    });
    expect(resumed.statements[0]?.params).toEqual([
      "Product",
      "scp_1",
      "scp_1",
      "platform.acme",
      "abc",
      null,
    ]);
    expect(resumed.statements[0]?.sql).toContain(
      "idx.facet_hash = excluded.facet_hash and idx.version is not distinct from excluded.version then idx.cursor",
    );
    expectBound(resumed.statements);
    const fresh = registryWith([{ cursor: null, doc_count: 0 }]);
    expect(await fresh.registry.begin("Product", undefined, "abc")).toEqual({ docCount: 0 });
    expect(fresh.statements[0]?.params.slice(1, 4)).toEqual(["-", null, null]);
    const versioned = registryWith([{ cursor: null, doc_count: 0 }]);
    await versioned.registry.begin("Product", scope, "abc", 2);
    expect(versioned.statements[0]?.params.at(-1)).toBe(2);
    expect(versioned.statements[0]?.sql).toContain("version = excluded.version");
    expectBound(versioned.statements);
  });

  it("records progress and the finish", async () => {
    const { registry, statements } = registryWith([]);
    await registry.progress("Product", scope, "prd_500", 500);
    await registry.finish("Product", scope, 812);
    expect(statements.map((statement) => statement.params)).toEqual([
      ["prd_500", 500, "Product", "scp_1"],
      [812, "Product", "scp_1"],
    ]);
    expect(statements[1]?.sql).toContain("state = 'valid', cursor = null");
    expectBound(statements);
  });
});
