/**
 * Stackra file contract:
 * Purpose: `PostgresSearchDriver`, the server's `SearchDriver`: the index lives in the model's own table, in the
 *          columns `t.searchable(...)` wrote, and a search fuses two ranked lanes by reciprocal rank: full-text (every
 *          word as a prefix, `ts_rank_cd` over the weighted vectors, the best locale counting) and trigram (word
 *          similarity of the phrase to the folded `search_text`). Facets count the filter values of the rows either lane
 *          matches (every indexed row holding the filters when there are no words), each row once per value.
 * Boundary: raw SQL on the running context's entity manager, so it joins the caller's transaction and scope session:
 *           row-level security decides the rows (so `isolatesScopes` is true and no `scopePaths` arrive), and the request's record-visibility subquery narrows both lanes
 *           before they rank or count. A word's alternatives (its Arabic spelling when Arabizi, its synonyms) apply in
 *           both lanes: they join its prefix as an OR group in full-text, and in trigram each alternative gives one more
 *           phrase (the word swapped for it), matched as an OR and ranked by the best (at most `MAX_PHRASES` phrases).
 *           Every value is a bound parameter; identifiers are quoted and come from the ORM metadata and the catalogue; configuration names come from
 *           `TEXT_SEARCH_CONFIGS` only. A table's vector columns are read once from the catalogue and kept, so a
 *           table's locales need no configuration. Each lane ranks at most `CANDIDATES` rows, so a page past that window
 *           is empty. The vector lane (pgvector) waits for an embedding port.
 * Runtime: node
 * Governing contract: ADR 0221 (decisions 1, 3 and 7); ADR 0160 (raw SQL is parameterised; approved extensions);
 *                     ADR 0327 (decision 9: isolation in the database); ADR 0294 (decision 16); ADR 0333 (amendment);
 *                     ADR 0404 (facets under the VisibilityFilter; `search.fold`).
 */
import { Driver } from "@stackra/container";
import type { Database } from "@stackra/database";

import { SearchDriver } from "#contracts/index";
import type {
  SearchDocument,
  SearchFacetRequest,
  SearchFacets,
  SearchRequest,
  SearchTable,
} from "#contracts/index";
import { TEXT_SEARCH_CONFIGS } from "#node/constants/text-search-configs.constant";

/** One full-text column, the locale it holds (none for `search_vector`) and its text search configuration. */
interface VectorColumn {
  readonly name: string;
  readonly locale: string | undefined;
  readonly config: string;
}

/** The name of the locale-free vector, and the prefix of the per-locale ones. */
const VECTOR = "search_vector";

/** The `setweight` letter of field 0, 1, 2, and 3 or later. */
const WEIGHTS = ["A", "B", "C", "D"] as const;

/** Ranked rows per lane before fusion. */
const CANDIDATES = 1000;

/** The reciprocal rank fusion constant: a row's score is the sum of 1 / (60 + its rank) over the lanes. */
const FUSION = 60;

/** The most phrases the trigram lane matches: the phrase and its variants with one word swapped for an alternative. */
const MAX_PHRASES = 8;

/** The folding function of migration `search.0003_create_fold_function`, which the trigram index is built on. */
const FOLD = "search.fold";

/** A quoted identifier. */
const quote = (name: string): string => `"${name.replaceAll('"', '""')}"`;

/** The table's qualified, quoted name. */
const qualified = (table: SearchTable): string =>
  table.schema === undefined ? quote(table.table) : `${quote(table.schema)}.${quote(table.table)}`;

/** The tsquery text of `request`'s words: each as a prefix, its alternatives ORed in, all ANDed. */
const prefixesOf = (request: Pick<SearchRequest, "words" | "alternatives">): string =>
  request.words
    .map((word) => {
      const spellings = [word, ...(request.alternatives?.[word] ?? [])].map(
        (spelling) => `${spelling}:*`,
      );
      return spellings.length === 1 ? spellings[0] : `(${spellings.join(" | ")})`;
    })
    .join(" & ");

/** The trigram lane's phrases: the words, then each with one word swapped for one of its alternatives, capped. */
const phrasesOf = (request: Pick<SearchRequest, "words" | "alternatives">): readonly string[] => {
  const phrase = request.words.join(" ");
  const variants = request.words.flatMap((word, at) =>
    (request.alternatives?.[word] ?? []).map((spelling) =>
      request.words.map((other, position) => (position === at ? spelling : other)).join(" "),
    ),
  );
  // shortcut: variants past MAX_PHRASES are dropped (full-text still ORs every alternative); lift it if recall suffers.
  return [...new Set([phrase, ...variants])].slice(0, MAX_PHRASES);
};

/** The SQL that `search_text` is trigram-similar to any of `count` phrases, one placeholder each. */
const trigramMatchOf = (count: number): string => {
  const matches = Array.from({ length: count }, () => `${FOLD}(t."search_text") %> ?`);
  return count === 1 ? (matches[0] ?? "") : `(${matches.join(" or ")})`;
};

/** The SQL of the best word similarity of `search_text` to `count` phrases, one placeholder each. */
const similarityOf = (count: number): string => {
  const similarities = Array.from(
    { length: count },
    () => `word_similarity(?, ${FOLD}(t."search_text"))`,
  );
  return count === 1 ? (similarities[0] ?? "") : `greatest(${similarities.join(", ")})`;
};

/** The filter and visibility conditions of a lane, each opening with ` and `, and their parameters in order. */
function narrowingOf(
  table: SearchTable,
  request: Pick<SearchRequest, "filters" | "visible">,
): { readonly sql: string; readonly params: readonly unknown[] } {
  const filters = Object.entries(request.filters);
  const { visible } = request;
  return {
    sql:
      (filters.length === 0 ? "" : ` and t."search_filters" @> ?::jsonb`) +
      // Visibility bounds every lane before it ranks or counts (ADR 0333); the subquery is the ORM's, parameterised.
      (visible === undefined ? "" : ` and t.${quote(table.primaryKey)} in (${visible.sql})`),
    params: [
      ...(filters.length === 0
        ? []
        : [JSON.stringify(Object.fromEntries(filters.map(([path, value]) => [path, [value]])))]),
      ...(visible?.params ?? []),
    ],
  };
}

/** The text of one field for `locale`: that tag, else its language, else the first stored; every locale for none. */
function textIn(field: SearchDocument["fields"][number], locale: string | undefined): string {
  if (typeof field === "string") return field;
  const entries = Object.entries(field);
  if (locale === undefined) return entries.map(([, text]) => text).join(" ");
  const language = locale.split("-")[0];
  const found =
    entries.find(([tag]) => tag.toLowerCase() === locale) ??
    entries.find(([tag]) => tag.toLowerCase() === language) ??
    entries[0];
  return found?.[1] ?? "";
}

/**
 * The search over the model tables.
 *
 * @example
 * await database.withScope(scope, () => search.in(Product).page("linen", { limit: 20 }));
 */
export class PostgresSearchDriver extends Driver(SearchDriver) {
  /** Row-level security on the indexed table isolates scopes, so a request carries no `scopePaths`. */
  override readonly isolatesScopes = true;

  /** The connected database. */
  private readonly database: Database;

  /** Each table's vector columns, read once. */
  private readonly vectors = new Map<string, readonly VectorColumn[]>();

  /**
   * @param database - the connected database whose running context each statement joins.
   */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /**
   * The ids of the rows of `table` that match `request`, best first, sliced by its offset and limit.
   */
  async search(table: SearchTable, request: SearchRequest): Promise<readonly string[]> {
    const vectors = await this.vectorsOf(table);
    const { sql: narrowing, params: laneParams } = narrowingOf(table, request);
    const key = `t.${quote(table.primaryKey)}`;
    const phrases = phrasesOf(request);
    const prefixes = prefixesOf(request);
    // raw-sql: hybrid ranking (tsvector and trigram lanes fused by reciprocal rank) has no ORM form (ADR 0221 d1)
    const rows = (await this.database.em().execute(
      `with q as (select ${vectors.map((vector, index) => `to_tsquery('${vector.config}', ?) as q${index}`).join(", ")}),
fts as (
  select ${key} as id, row_number() over (order by greatest(${vectors.map((vector, index) => `ts_rank_cd(t.${quote(vector.name)}, q.q${index})`).join(", ")}) desc, ${key}) as rank
  from ${qualified(table)} t cross join q
  where (${vectors.map((vector, index) => `t.${quote(vector.name)} @@ q.q${index}`).join(" or ")})${narrowing}
  order by rank limit ${CANDIDATES}
),
trigram as (
  select ${key} as id, row_number() over (order by ${similarityOf(phrases.length)} desc, ${key}) as rank
  from ${qualified(table)} t
  where ${trigramMatchOf(phrases.length)}${narrowing}
  order by rank limit ${CANDIDATES}
)
select id from (
  select coalesce(fts.id, trigram.id) as id,
    coalesce(1.0 / (${FUSION} + fts.rank), 0) + coalesce(1.0 / (${FUSION} + trigram.rank), 0) as score
  from fts full join trigram on trigram.id = fts.id
) fused
order by score desc, id
limit ? offset ?`,
      [
        ...vectors.map(() => prefixes),
        ...laneParams,
        ...phrases,
        ...phrases,
        ...laneParams,
        request.limit,
        request.offset,
      ],
    )) as unknown as readonly { readonly id: unknown }[];
    return rows.map((row) => String(row.id));
  }

  /**
   * Per requested path, how many rows matching `request` hold each value, under its record visibility.
   */
  async facets(table: SearchTable, request: SearchFacetRequest): Promise<SearchFacets> {
    if (request.paths.length === 0) return {};
    const vectors = await this.vectorsOf(table);
    const { sql: narrowing, params: narrowingParams } = narrowingOf(table, request);
    const key = `t.${quote(table.primaryKey)}`;
    const searching = request.words.length > 0;
    const prefixes = prefixesOf(request);
    const phrases = phrasesOf(request);
    const match = searching
      ? `((${vectors.map((vector) => `t.${quote(vector.name)} @@ to_tsquery('${vector.config}', ?)`).join(" or ")}) or ${trigramMatchOf(phrases.length)})`
      : `t."search_filters" is not null`;
    // raw-sql: counting jsonb filter values per path over the matching rows has no ORM form (ADR 0221 d1)
    const rows = (await this.database.em().execute(
      `with hits as (
  select ${key} as id, t."search_filters" as filters
  from ${qualified(table)} t
  where ${match}${narrowing}
),
counted as (
  select facet_path.path, facet_value.value, count(distinct hits.id)::int as count
  from hits
  cross join unnest(?::text[]) as facet_path(path)
  cross join lateral jsonb_array_elements_text(coalesce(hits.filters -> facet_path.path, '[]'::jsonb)) as facet_value(value)
  group by facet_path.path, facet_value.value
)
select path, value, count from (
  select path, value, count, row_number() over (partition by path order by count desc, value) as rank from counted
) ranked
where rank <= ?
order by path, rank`,
      [
        ...(searching ? [...vectors.map(() => prefixes), ...phrases] : []),
        ...narrowingParams,
        [...request.paths],
        request.limit,
      ],
    )) as unknown as readonly {
      readonly path: string;
      readonly value: string;
      readonly count: number;
    }[];
    const facets: Record<string, Record<string, number>> = Object.fromEntries(
      request.paths.map((path) => [path, {}]),
    );
    for (const row of rows) {
      const counts = facets[row.path];
      if (counts !== undefined) counts[row.value] = Number(row.count);
    }
    return facets;
  }

  /** Stores each document as its row's current one, replacing what was stored. */
  async index(table: SearchTable, documents: readonly SearchDocument[]): Promise<void> {
    if (documents.length === 0) return;
    const vectors = await this.vectorsOf(table);
    for (const document of documents) {
      const params: unknown[] = [];
      const sets = vectors.map((vector) => {
        const weighted = document.fields.map((field, position) => {
          params.push(textIn(field, vector.locale));
          return `setweight(to_tsvector('${vector.config}', ?), '${WEIGHTS[Math.min(position, WEIGHTS.length - 1)]}')`;
        });
        return `${quote(vector.name)} = ${weighted.join(" || ")}`;
      });
      params.push(
        document.fields.map((field) => textIn(field, undefined)).join(" "),
        JSON.stringify(document.filters),
        document.id,
      );
      // raw-sql: the search columns are not model fields, so the ORM cannot write them
      // shortcut: one statement per document; batch with unnest once indexing volume needs it.
      await this.database
        .em()
        .execute(
          `update ${qualified(table)} set ${sets.join(", ")}, "search_text" = ?, "search_filters" = ?::jsonb where ${quote(table.primaryKey)} = ?`,
          params,
        );
    }
  }

  /** Removes the documents of `ids`, so no search finds those rows until they are indexed again. */
  async remove(table: SearchTable, ids: readonly string[]): Promise<void> {
    if (ids.length === 0) return;
    const vectors = await this.vectorsOf(table);
    const cleared = [...vectors.map((vector) => vector.name), "search_text", "search_filters"]
      .map((name) => `${quote(name)} = null`)
      .join(", ");
    // raw-sql: the search columns are not model fields, so the ORM cannot clear them
    await this.database
      .em()
      .execute(
        `update ${qualified(table)} set ${cleared} where ${quote(table.primaryKey)} in (${ids.map(() => "?").join(", ")})`,
        [...ids],
      );
  }

  /**
   * The vector columns of `table`, read from the catalogue the first time.
   *
   * @throws TypeError when the table has none: no migration called `t.searchable(...)` on it.
   */
  private async vectorsOf(table: SearchTable): Promise<readonly VectorColumn[]> {
    const key = `${table.schema ?? ""}.${table.table}`;
    const known = this.vectors.get(key);
    if (known !== undefined) return known;
    // raw-sql: the columns t.searchable(...) wrote are read from the catalogue, so a table's locales need no config
    const rows = (await this.database.em().execute(
      `select column_name from information_schema.columns
where table_schema = ${table.schema === undefined ? "current_schema()" : "?"} and table_name = ?
  and (column_name = '${VECTOR}' or left(column_name, ${VECTOR.length + 1}) = '${VECTOR}_')
order by column_name`,
      [...(table.schema === undefined ? [] : [table.schema]), table.table],
    )) as unknown as readonly { readonly column_name: string }[];
    const vectors = rows.map(({ column_name: name }): VectorColumn => {
      const locale =
        name === VECTOR ? undefined : name.slice(VECTOR.length + 1).replaceAll("_", "-");
      const language = locale?.split("-")[0];
      return {
        name,
        locale,
        config: (language === undefined ? undefined : TEXT_SEARCH_CONFIGS[language]) ?? "simple",
      };
    });
    if (vectors.length === 0)
      throw new TypeError(
        `${qualified(table)} has no search columns: a migration calls t.searchable(...) on it first`,
      );
    this.vectors.set(key, vectors);
    return vectors;
  }
}
