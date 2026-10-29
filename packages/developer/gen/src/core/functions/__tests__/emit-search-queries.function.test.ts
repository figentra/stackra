/**
 * Stackra file contract:
 * Purpose: unit tests of `emitSearchQueries`: one `Search<Model>Query extends SearchQuery(<Model>)` per own
 *          `@Searchable` model, nothing for a member without `@stackra/search` or without a searchable model, and a
 *          hand-written `Search<Model>Query` takes the generated one's place; `searchQueriesOf` declares each generated
 *          query with the key, actors and constructor tokens of `SearchQuery` (STA-1459).
 * Boundary: test only; pure IR in, file text out.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0221 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { emitSearchQueries } from "#core/functions/emit-search-queries.function";
import { searchQueriesOf } from "#core/functions/search-queries-of.function";
import type { MemberIR } from "#core/types/member-ir.type";

/** The billing fixture (its `Invoice` is `@Searchable`) declaring `@stackra/search`. */
const SEARCHING: MemberIR = {
  ...BILLING_IR,
  packages: [...(BILLING_IR.packages ?? []), "@stackra/search"],
};

describe("emitSearchQueries", () => {
  it("writes one search query per searchable model", () => {
    const text = emitSearchQueries(SEARCHING) ?? "";
    expect(text).toContain('import { SearchQuery } from "@stackra/search/node";');
    expect(text).toContain("export class SearchInvoiceQuery extends SearchQuery(Invoice) {}");
    expect(text).not.toContain("SearchInvoiceLineQuery");
  });

  it("writes nothing without @stackra/search or without a searchable model", () => {
    const unsearched: MemberIR = {
      ...BILLING_IR,
      packages: (BILLING_IR.packages ?? []).filter((name) => name !== "@stackra/search"),
    };
    expect(emitSearchQueries(unsearched)).toBeUndefined();
    const none: MemberIR = {
      ...SEARCHING,
      classes: SEARCHING.classes.map((declared) => ({ ...declared, facets: [] })),
    };
    expect(emitSearchQueries(none)).toBeUndefined();
  });

  it("leaves a model whose search query the member wrote by hand", () => {
    const invoice = SEARCHING.classes.find((declared) => declared.name === "Invoice");
    if (invoice === undefined) throw new Error("the fixture has no Invoice");
    const authored: MemberIR = {
      ...SEARCHING,
      classes: [
        ...SEARCHING.classes,
        {
          ...invoice,
          name: "SearchInvoiceQuery",
          kind: "query",
          facets: [],
          file: "src/modules/billing/queries/search-invoice.query.ts",
          importPath: "#modules/billing/queries/search-invoice.query",
        },
      ],
    };
    expect(emitSearchQueries(authored)).toBeUndefined();
  });
});

describe("searchQueriesOf", () => {
  it("declares the generated query of each searchable model", () => {
    const pairs = searchQueriesOf(SEARCHING);
    expect(pairs.map((pair) => pair.model.name)).toEqual(["Invoice"]);
    expect(pairs[0]?.query).toMatchObject({
      name: "SearchInvoiceQuery",
      kind: "query",
      module: "billing",
      file: ".stackra/gen/search.ts",
      importPath: "#stackra/search",
      options: { key: "invoice.search", actors: ["user", "agent", "service"] },
      deps: [
        { class: { name: "Search", from: "@stackra/search" } },
        { class: { name: "Database", from: "@stackra/database" } },
      ],
    });
  });

  it("snake-cases a model name the way SearchQuery does", () => {
    const invoice = SEARCHING.classes.find((declared) => declared.name === "Invoice");
    if (invoice === undefined) throw new Error("the fixture has no Invoice");
    const ir: MemberIR = { ...SEARCHING, classes: [{ ...invoice, name: "SalesOrder" }] };
    expect(searchQueriesOf(ir)[0]?.query.options["key"]).toBe("sales_order.search");
  });
});
