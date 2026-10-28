/**
 * Stackra file contract:
 * Purpose: `SearchIndexRegistry`, the index registry over `search.indexes`: `list` answers every index's status,
 *          `invalidateChanged` marks invalid the indexes whose `@Searchable` facet changed since their last rebuild,
 *          and `begin`, `progress` and `finish` record a reindex job's run so a stopped rebuild resumes from its cursor.
 * Boundary: a platform service over raw SQL on the running context's entity manager, one statement per method, every
 *           value bound and every result row read through zod. The table holds counts and states, never row data, and
 *           is read across scopes (no row-level security), so only platform code (the reindex job, `search:status`, an
 *           admin read) calls it. An index is keyed by model class name and scope (`-` for platform-wide).
 * Runtime: node
 * Governing contract: ADR 0404 (decision 3: the reindex plan, run as a job); ADR 0221 (decision 7); ADR 0160 (raw SQL
 *                     is parameterised and typed with zod); ADR 0327 and ADR 0323 (a scope is a `ScopeRef`).
 */
import { Service } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import { Enum } from "@stackra/contracts";
import type { PublicId, ScopeRef } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { Searchable } from "@stackra/model";
import { z } from "zod";

import { SearchIndexState } from "#core/enums/search-index-state.enum";
import type { SearchIndexStatus } from "#core/types/search-index-status.type";
import { searchFacetHashOf } from "#node/functions/search-facet-hash-of.function";

/** The registry table, in the package's schema. */
const TABLE = '"search"."indexes"';

/** One row of `search.indexes`. */
const ROW = z.object({
  model: z.string(),
  scope_id: z.string().nullable(),
  scope_path: z.string().nullable(),
  state: z.enum(Enum.values(SearchIndexState) as [SearchIndexState, ...SearchIndexState[]]),
  facet_hash: z.string(),
  doc_count: z.number().int(),
  cursor: z.string().nullable(),
  rebuilt_at: z.coerce.date().nullable(),
});

/** Rows of `search.indexes`. */
const ROWS = z.array(ROW);

/** Rows that carry only a model name. */
const MODELS = z.array(z.object({ model: z.string() }));

/** Rows that carry a resume cursor and the documents indexed before it. */
const CURSORS = z.array(z.object({ cursor: z.string().nullable(), doc_count: z.number().int() }));

/** The key of a scope: its id, or `-` for platform-wide. */
const scopeKeyOf = (scope: ScopeRef | undefined): string => scope?.id ?? "-";

/** The status of one row. */
function statusOf(row: z.infer<typeof ROW>): SearchIndexStatus {
  return Object.freeze({
    model: row.model,
    ...(row.scope_id === null || row.scope_path === null
      ? {}
      : { scope: { id: row.scope_id as PublicId<"scp">, path: row.scope_path } }),
    state: row.state,
    facetHash: row.facet_hash,
    docCount: row.doc_count,
    ...(row.cursor === null ? {} : { cursor: row.cursor }),
    ...(row.rebuilt_at === null ? {} : { rebuiltAt: row.rebuilt_at }),
  });
}

/**
 * Keeps the search index registry.
 *
 * @example
 * await registry.invalidateChanged([Product, Customer]); // at boot
 * for (const index of await registry.list()) console.log(index.model, index.state);
 */
export class SearchIndexRegistry extends Service {
  /** The connected database. */
  private readonly database: Database;

  /**
   * @param database - the connected database whose running context each statement joins.
   */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /** Every index, by model then scope. */
  async list(): Promise<readonly SearchIndexStatus[]> {
    // raw-sql: the registry has no model; one parameterised select
    const rows = await this.database
      .em()
      .execute(
        "select model, scope_id, scope_path, state, facet_hash, doc_count, cursor, rebuilt_at " +
          `from ${TABLE} order by model, scope_key`,
        [],
      );
    return ROWS.parse(rows).map(statusOf);
  }

  /**
   * Marks invalid every index of `models` whose stored facet hash is not the model's current one and that is not
   * rebuilding; a rebuild records the new hash when it begins.
   *
   * @returns the names of the models with an index marked invalid, once each.
   * @throws TypeError when a model is not `@Searchable`.
   */
  async invalidateChanged(models: readonly AnyClass[]): Promise<readonly string[]> {
    const changed = new Set<string>();
    for (const model of models) {
      const facet = Searchable.on(model);
      if (facet === undefined)
        throw new TypeError(`${model.name} is not @Searchable, so it has no search index`);
      // raw-sql: the registry has no model; one parameterised update per model
      const rows = await this.database
        .em()
        .execute(
          `update ${TABLE} set state = 'invalid', updated_at = now() ` +
            "where model = ? and facet_hash <> ? and state <> 'rebuilding' returning model",
          [model.name, searchFacetHashOf(facet)],
        );
      if (MODELS.parse(rows).length > 0) changed.add(model.name);
    }
    return [...changed];
  }

  /**
   * Records that a full rebuild of `model` in `scope` begins with `facetHash`.
   *
   * @returns the cursor to resume after and the documents indexed before it: what a stopped rebuild with the same facet
   *          recorded, else no cursor and `0`.
   */
  async begin(
    model: string,
    scope: ScopeRef | undefined,
    facetHash: string,
  ): Promise<{ readonly cursor?: string; readonly docCount: number }> {
    // raw-sql: an upsert that keeps the cursor of a stopped rebuild of the same facet, which the ORM cannot express
    const rows = await this.database
      .em()
      .execute(
        `insert into ${TABLE} as idx (model, scope_key, scope_id, scope_path, state, facet_hash, doc_count) ` +
          "values (?, ?, ?, ?, 'rebuilding', ?, 0) on conflict (model, scope_key) do update set " +
          "cursor = case when idx.state = 'rebuilding' and idx.facet_hash = excluded.facet_hash then idx.cursor end, " +
          "doc_count = case when idx.state = 'rebuilding' and idx.facet_hash = excluded.facet_hash " +
          "then idx.doc_count else 0 end, state = 'rebuilding', facet_hash = excluded.facet_hash, " +
          "updated_at = now() returning cursor, doc_count",
        [model, scopeKeyOf(scope), scope?.id ?? null, scope?.path ?? null, facetHash],
      );
    const [row] = CURSORS.parse(rows);
    return row === undefined || row.cursor === null
      ? { docCount: 0 }
      : { cursor: row.cursor, docCount: row.doc_count };
  }

  /** Records that the rebuild of `model` in `scope` stored `docCount` documents up to `cursor`. */
  async progress(
    model: string,
    scope: ScopeRef | undefined,
    cursor: string,
    docCount: number,
  ): Promise<void> {
    // raw-sql: the registry has no model; one parameterised update
    await this.database
      .em()
      .execute(
        `update ${TABLE} set cursor = ?, doc_count = ?, updated_at = now() ` +
          "where model = ? and scope_key = ?",
        [cursor, docCount, model, scopeKeyOf(scope)],
      );
  }

  /** Records that the rebuild of `model` in `scope` finished with `docCount` documents: the index is valid. */
  async finish(model: string, scope: ScopeRef | undefined, docCount: number): Promise<void> {
    // raw-sql: the registry has no model; one parameterised update
    await this.database
      .em()
      .execute(
        `update ${TABLE} set state = 'valid', cursor = null, doc_count = ?, rebuilt_at = now(), ` +
          "updated_at = now() where model = ? and scope_key = ?",
        [docCount, model, scopeKeyOf(scope)],
      );
  }
}
