/**
 * Stackra file contract:
 * Purpose: `SearchQuery(Model, options?)`, the base of the search query gen writes for each `@Searchable` model
 *          (`class SearchProductQuery extends SearchQuery(Product) {}`, key `product.search`): a `GET` endpoint, an MCP
 *          tool and a typed client query that answer a phrase with the model's best hits as key, title and snippet.
 *          It is the search API the Cmd+K `SearchPalette` and public search widgets read (ADR 0221 d4 and d6).
 * Boundary: a query kind base built per model; it holds no state beyond its two constructor dependencies. Each call
 *           reads the model's own index through `Search.in(model).find`, so the call's row-level security, the index's
 *           record visibility and its synonyms apply, and the phrase uses the call's locale. Filters stay server-side:
 *           a query that needs them is hand-written over `Search`. The answer never carries the row, only what a result
 *           list shows. Gen writes the subclass and its wiring; a hand-written subclass (for a public search, say)
 *           takes the generated one's place.
 * Runtime: node
 * Governing contract: ADR 0221 (decisions 2, 4 and 6, settled 2026-10-29); ADR 0294 (decisions 16, 21 and 25); ADR 0155
 *                     (queries are MCP tools); ADR 0341 (decision 2: the `search` effect).
 */
import { Query, type QueryContext } from "@stackra/actions";
import type { AnyClass } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { Searchable, Translated } from "@stackra/model";

import type { Search } from "#core/services/search.service";
import type { SearchQueryInput } from "#node/schemas/search-query-input.schema";
import { SearchQueryOutput } from "#node/schemas/search-query-output.schema";
import type { SearchQueryClass } from "#node/types/search-query-class.type";
import type { SearchQueryHit } from "#node/types/search-query-hit.type";
import type { SearchQueryOptions } from "#node/types/search-query-options.type";

/** Hits per search when the input names no limit. */
const DEFAULT_LIMIT = 10;

/** The callers of a search query when the options name none. */
const DEFAULT_ACTORS: readonly ActorKind[] = [ActorKind.User, ActorKind.Agent, ActorKind.Service];

/** `SalesOrder` to `sales_order`, the model part of a call key. */
function snakeOf(name: string): string {
  return name.replaceAll(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}

/**
 * The base class of `model`'s search query.
 *
 * @throws TypeError when the model has no `@Searchable` facet, or (from `Query`) for a malformed key or actor list.
 * @example
 * export class SearchProductQuery extends SearchQuery(Product) {}
 *
 * // a public storefront search, written by hand in place of the generated one
 * export class SearchProductQuery extends SearchQuery(Product, {
 *   actors: [ActorKind.Anonymous, ActorKind.User],
 *   area: ApiArea.Public,
 * }) {}
 */
export function SearchQuery<M extends object>(
  model: AnyClass<M>,
  options: SearchQueryOptions = {},
): SearchQueryClass {
  const facet = Searchable.on(model);
  if (facet === undefined)
    throw new TypeError(`${model.name} is not @Searchable, so it has no search query`);
  const { key, actors, ...rest } = options;
  // The first plain text field titles a hit; a dotted path lives on a relation the hit does not load.
  const titleField = facet.text.find((path) => !path.includes("."));

  return class extends Query({
    ...rest,
    key: key ?? `${snakeOf(model.name)}.search`,
    actors: actors ?? DEFAULT_ACTORS,
  }) {
    /** Reaches the model's index. */
    private readonly search: Search;

    /** Reads the model's primary key from its ORM metadata. */
    private readonly database: Database;

    /**
     * @param search - the search service whose index of the model is read.
     * @param database - the connected database the model's primary key is read from.
     */
    constructor(search: Search, database: Database) {
      super();
      this.search = search;
      this.database = database;
    }

    /** The hits of `input.q`, best first, each with its key, title and snippet. */
    async handle(input: SearchQueryInput, ctx: QueryContext): Promise<SearchQueryOutput> {
      const index = this.search.in(model);
      const rows = await index.find(input.q, {
        limit: input.limit ?? DEFAULT_LIMIT,
        locale: ctx.locale,
        arabizi: input.arabizi,
      });
      const [primaryKey] = this.database.em().getMetadata(model).primaryKeys;
      const snippets = index.snippets(rows, input.q, { locale: ctx.locale });
      const hits = rows.map((row): SearchQueryHit => {
        const values = row as Readonly<Record<string, unknown>>;
        const id = String(values[String(primaryKey)]);
        const snippet = snippets.get(id);
        return {
          id,
          title:
            textOf(titleField === undefined ? undefined : values[titleField], ctx.locale) || id,
          ...(snippet === undefined ? {} : { snippet }),
        };
      });
      return SearchQueryOutput.create({ hits });
    }
  };
}

/** A title field's value as text in `locale`: a translated value through its fallback chain, a scalar as written. */
function textOf(value: unknown, locale: string): string {
  if (value instanceof Translated) return value.in(locale);
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  return "";
}
