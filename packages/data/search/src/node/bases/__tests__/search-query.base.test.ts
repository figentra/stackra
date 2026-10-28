/**
 * Stackra file contract:
 * Purpose: unit tests of `SearchQuery`: the derived `<model>.search` key and default actors, the public options passing
 *          through, the refusal of a model with no `@Searchable` facet, and `handle` reading the model's index in the
 *          call's locale and answering each row as its key, title (a translated title in the call's locale, the key
 *          when empty) and snippet.
 * Boundary: test only; a stand-in `Search` whose index records its calls and a stand-in `Database` whose metadata names
 *           the primary key, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0221 (decisions 4 and 6, settled 2026-10-29).
 */
import type { QueryContext } from "@stackra/actions";
import { kindOf } from "@stackra/container";
import { ActorKind, ApiArea } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { Model, Searchable, Translated } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import type { Search } from "#core/services/search.service";
import type { SearchFindOptions } from "#core/types/search-find-options.type";
import { SearchQuery } from "#node/bases/search-query.base";
import { SearchQueryInput } from "#node/schemas/search-query-input.schema";

@Searchable({ text: ["category.name", "title", "body"] })
class SalesOrder extends Model.with() {}

class Plain extends Model.with() {}

const ctx = { locale: "ar-SA" } as unknown as QueryContext;

/** A search whose index answers `rows` and a snippet for `o_1`, recording each `find`. */
function searchOf(rows: readonly object[]) {
  const finds: { readonly phrase: string; readonly options: SearchFindOptions<object> }[] = [];
  const snippetCalls: unknown[][] = [];
  const search = {
    in: () => ({
      find: async (phrase: string, options: SearchFindOptions<object>) => {
        finds.push({ phrase, options });
        return rows;
      },
      snippets: (...args: unknown[]) => {
        snippetCalls.push(args);
        return new Map([["o_1", "…linen shirt…"]]);
      },
    }),
  } as unknown as Search;
  return { search, finds, snippetCalls };
}

const database = {
  em: () => ({ getMetadata: () => ({ primaryKeys: ["id"] }) }),
} as unknown as Database;

describe("SearchQuery", () => {
  it("derives the key from the model and defaults the actors", () => {
    expect(kindOf(SearchQuery(SalesOrder))?.options).toMatchObject({
      key: "sales_order.search",
      actors: [ActorKind.User, ActorKind.Agent, ActorKind.Service],
      tool: true,
    });
  });

  it("passes a public search's options through", () => {
    const options = kindOf(
      SearchQuery(SalesOrder, {
        key: "order.find",
        actors: [ActorKind.Anonymous],
        area: ApiArea.Public,
      }),
    )?.options;
    expect(options).toMatchObject({
      key: "order.find",
      actors: [ActorKind.Anonymous],
      area: ApiArea.Public,
    });
  });

  it("refuses a model with no @Searchable facet", () => {
    expect(() => SearchQuery(Plain)).toThrow(TypeError);
  });

  it("answers each row as its key, title and snippet", async () => {
    const { search, finds, snippetCalls } = searchOf([
      { id: "o_1", title: Translated.of({ en: "Shirt", ar: "قميص" }) },
      { id: "o_2", title: "" },
    ]);
    class SearchSalesOrderQuery extends SearchQuery(SalesOrder) {}
    const output = await new SearchSalesOrderQuery(search, database).handle(
      SearchQueryInput.create({ q: "shirt", arabizi: false }),
      ctx,
    );
    expect(finds).toEqual([
      { phrase: "shirt", options: { limit: 10, locale: "ar-SA", arabizi: false } },
    ]);
    expect(snippetCalls[0]?.[2]).toEqual({ locale: "ar-SA" });
    expect(output.hits).toEqual([
      { id: "o_1", title: "قميص", snippet: "…linen shirt…" },
      { id: "o_2", title: "o_2" },
    ]);
  });

  it("caps the hits at the input's limit", async () => {
    const { search, finds } = searchOf([]);
    class SearchSalesOrderQuery extends SearchQuery(SalesOrder) {}
    await new SearchSalesOrderQuery(search, database).handle(
      SearchQueryInput.create({ q: "shirt", limit: 3 }),
      ctx,
    );
    expect(finds[0]?.options.limit).toBe(3);
  });
});
