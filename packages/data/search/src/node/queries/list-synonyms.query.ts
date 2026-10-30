/**
 * Stackra file contract:
 * Purpose: `ListSynonymsQuery`, `search.synonym.list@1`: the caller's tenant's synonym sets, optionally of one index or
 *          language; also an MCP tool (queries are by default).
 * Boundary: read only, no transaction, uncached (an edit shows at once). Its permission is `SynonymPermissions.read`
 *           (L0); the route is the convention's `GET /synonyms`. Row-level security returns the caller's tenant's rows
 *           only, oldest first.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 2, 16 and 21); ADR 0360 (decision 4); ADR 0155 (queries are MCP tools); ADR
 *                     0492 (decision 5).
 */
import { Query, type QueryContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";

import { SynonymPermissions } from "#node/access/synonym.permissions";
import type { ListSynonymsInput } from "#node/schemas/list-synonyms-input.schema";
import { ListSynonymsOutput } from "#node/schemas/list-synonyms-output.schema";
import type { SynonymService } from "#node/services/synonym.service";

/**
 * Lists the sets.
 *
 * @example
 * const { items } = await pipeline.execute(ListSynonymsQuery, { indexName: "products" }, { actor });
 */
export class ListSynonymsQuery extends Query({
  key: "synonym.list",
  permission: SynonymPermissions.read,
  actors: [ActorKind.User, ActorKind.Agent],
}) {
  /** Reads the rows. */
  private readonly synonyms: SynonymService;

  /**
   * @param synonyms - reads the rows.
   */
  constructor(synonyms: SynonymService) {
    super();
    this.synonyms = synonyms;
  }

  /** The tenant's sets matching the input, oldest first. */
  async handle(input: ListSynonymsInput, _ctx: QueryContext): Promise<ListSynonymsOutput> {
    const rows = await this.synonyms.find(
      {
        ...(input.indexName === undefined ? {} : { indexName: input.indexName }),
        ...(input.language === undefined ? {} : { language: input.language }),
      },
      { orderBy: { createdAt: "asc", id: "asc" } },
    );
    return ListSynonymsOutput.create({
      items: rows.map((row) => ({
        id: row.id,
        indexName: row.indexName,
        language: row.language,
        terms: [...row.terms],
      })),
    });
  }
}
