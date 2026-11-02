/**
 * Stackra file contract:
 * Purpose: `ResourceListQuery(options)`, the base of the list read gen writes for a resource whose `list` operation is
 *          `true` (`class ListLoyaltyAccountsQuery extends ResourceListQuery({ key: "loyalty_account.list", ... })`):
 *          a page of the table's rows read through the model's `CrudService`, each as the resource's row.
 * Boundary: a query kind base built per resource, holding only its two constructor dependencies. It refuses a sort key,
 *           a filter key or a search its table does not declare (`ResourceQueryInputInvalidError`), so no undeclared
 *           name reaches `CrudService.table`; the read runs in the caller's transaction, under row-level security and the
 *           bound `VisibilityFilter`. A search asks the model's own generated search query for its best hits and narrows
 *           the page to them. Gen writes the subclass, its constructor and its options.
 * Runtime: node
 * Governing contract: ADR 0307 (rules 1, 2 and 4); ResourceOperations (`true`: one gen writes over the model's
 *                     service); ADR 0155 (queries are MCP tools); STA-1971.
 */
import { Query, type QueryContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import type { CrudService } from "@stackra/database";

import { ResourceQueryInputInvalidError } from "#node/errors/resource-query-input-invalid.error";
import { rowOf } from "#node/functions/row-of.function";
import type { ResourceListInput } from "#node/types/resource-list-input.type";
import type { ResourceListOptions } from "#node/types/resource-list-options.type";
import type { ResourceListOutput } from "#node/types/resource-list-output.type";
import type { ResourceSearch } from "#node/types/resource-search.type";

/** Rows per page when the input names no limit, and the most a page takes. */
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** The most search hits a list narrows to. */
const SEARCH_HITS = 100;

/** The callers of a generated read: as the generated search query. */
const ACTORS: readonly ActorKind[] = [ActorKind.User, ActorKind.Agent, ActorKind.Service];

/**
 * The base class of one resource's list read.
 *
 * @example
 * export class ListLoyaltyAccountsQuery extends ResourceListQuery({
 *   key: "loyalty_account.list",
 *   sortable: ["tier", "createdAt"],
 *   filters: ["tier", "isFrozen", "createdAt"],
 *   fields: ["memberId", "tier", "isFrozen", "frozenAt", "createdAt"],
 * }) {
 *   constructor(service: AccountService) {
 *     super(service);
 *   }
 * }
 */
export function ResourceListQuery(options: ResourceListOptions) {
  const sortable = new Set(options.sortable);
  const filters = new Set(options.filters);
  const refuse = (part: string, key: string): never => {
    throw ResourceQueryInputInvalidError.create({ query: options.key, part, key });
  };

  return class extends Query({ key: options.key, actors: ACTORS }) {
    /** The model's service, which reads the table. */
    private readonly service: CrudService<object>;

    /** The model's generated search query, for a table that searches. */
    private readonly search: ResourceSearch | undefined;

    /**
     * @param service - the model's `CrudService`.
     * @param search - the model's generated search query, for a searchable table.
     */
    constructor(service: CrudService<object>, search?: ResourceSearch) {
      super();
      this.service = service;
      this.search = search;
    }

    /** One page of rows, sorted, filtered and searched as the table allows. */
    async handle(input: ResourceListInput, ctx: QueryContext): Promise<ResourceListOutput> {
      const sorts =
        input.sort === undefined ? [] : Array.isArray(input.sort) ? input.sort : [input.sort];
      for (const sort of sorts as readonly { readonly key: string }[])
        if (!sortable.has(sort.key)) refuse("sort", sort.key);
      for (const key of Object.keys(input.filter ?? {}))
        if (!filters.has(key)) refuse("filter", key);
      const phrase = input.search?.trim() ?? "";
      if (phrase !== "" && (options.searchable !== true || this.search === undefined))
        refuse("search", "search");

      let filter = input.filter;
      if (phrase !== "" && this.search !== undefined) {
        const { hits } = await this.search.handle({ q: phrase, limit: SEARCH_HITS }, ctx);
        if (hits.length === 0) return { items: [], hasMore: false };
        filter = { ...filter, id: hits.map((hit) => hit.id) };
      }
      const page = await this.service.table({
        limit: Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT),
        ...(input.cursor === undefined ? {} : { cursor: input.cursor }),
        ...(input.sort === undefined ? {} : { sort: input.sort }),
        ...(filter === undefined ? {} : { filter }),
      });
      return {
        items: page.items.map((record) => rowOf(this.service, record, options.fields)),
        ...(page.nextCursor === undefined ? {} : { nextCursor: page.nextCursor }),
        hasMore: page.hasMore,
      };
    }
  };
}
