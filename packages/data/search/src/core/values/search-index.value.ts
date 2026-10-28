/**
 * Stackra file contract:
 * Purpose: `SearchIndex<M>`, one model's search index as `search.in(Model)` returns it: ranked `find` and cursor
 *          `page` reads that return loaded rows (hybrid with the vector lane when given an embedder), the semantic
 *          `similar` read, `facets` (value counts of the filter fields over the same matches),
 *          `snippets` for a result list, and `index`, `remove` and `reindex`, which keep the documents current, with
 *          `prepare` and `swap` for a versioned rebuild.
 * Boundary: a value built by `Search`, never injected. It reads the model's `@Searchable` facet and its ORM metadata,
 *           builds documents and phrase words (the one normalisation, ADR 0221 d3) and leaves ranking and storage to the
 *           driver. Every read and write runs on the running context's entity manager, so it joins the caller's
 *           transaction and scope session: row-level security isolates, and record visibility is the only
 *           narrowing added. A cursor is the next page's offset; a page past the driver's candidate window is empty.
 *           Record visibility (ADR 0333) is handed to the driver as a key subquery, so it bounds the rows before
 *           they are ranked or counted (a facet count never includes a row the caller may not see). An Arabizi word
 *           also matches its Arabic spelling unless the read turns `arabizi` off, and a word in one of the index's synonym sets (`search.synonyms`, read per
 *           call through the `SettingsReader` `Search` passes, in the read's language or every language) also matches
 *           the other words of the set. A snippet never shows a `no_snippet` field outside the record's team. Each
 *           document carries its row's scope; for an engine that does not isolate scopes in the database, every read
 *           also carries the scope paths of the session (`app.scope_paths`, read from the database, never input), so
 *           pages and facet counts never cross scopes. The index's ranking rules (`search.rules`: pins, hides, boosts,
 *           recency) reach a driver that applies them; a sampled read or click goes to the query log (never awaited,
 *           its phrase withheld when personal); `suggest` completes a prefix from the log and corrects a prefix that
 *           finds nothing from the indexed words the caller may see. A filter may name several values (any of them holds), a range
 *           field may be bounded and sortable fields order the rows before relevance, on a driver whose `fieldKinds`
 *           says it applies them; a row the facet's `when` refuses is removed instead of indexed.
 * Runtime: node
 * Governing contract: ADR 0221 (decisions 1, 2, 3 and 7); ADR 0294 (decision 6: `@Searchable` is a class facet);
 *                     cursor pagination in the HTTP conventions; ADR 0327 (decision 9: isolation in the database); ADR 0333
 *                     (amendment); ADR 0341 (decision 2); OS-173; ADR 0404 (facets); ADR 0403 (per-language synonyms);
 *                     ADR 0307 (rules 22 to 24); STA-1251 (the per-query Arabizi switch); ADR 0089 (decision 6:
 *                     every query scoped); stackra-301 (the vector lane, `similar`); stackra-303
 *                     (versioned rebuild and swap); stackra-302 (field kinds);
 *                     stackra-326 (ranking rules, query log, suggest).
 */
import type { AnyClass } from "@stackra/container";
import type { PublicId, ScopeRef } from "@stackra/contracts";
import { visibleKeysQuery } from "@stackra/database";
import type { Database, TablePage } from "@stackra/database";
import { Classify, Searchable, SearchSnippet, Translated } from "@stackra/model";
import type { SearchableOptions } from "@stackra/model";
import type { SettingsReader } from "@stackra/settings";
import { z } from "zod";

import type {
  Embedder,
  SearchDriver,
  SearchFacets,
  SearchFilterValue,
  SearchQueryLog,
  SearchRange,
  SearchRequest,
  SearchSort,
  SearchTable,
  SearchVector,
} from "#contracts/index";
import { SEMANTIC_SOURCE } from "#core/constants/semantic-source.constant";
import { SearchCursorInvalidError } from "#core/errors/search-cursor-invalid.error";
import { arabiziOf } from "#core/functions/arabizi-of.function";
import { searchDocumentOf } from "#core/functions/search-document-of.function";
import { searchPathsOf } from "#core/functions/search-paths-of.function";
import { searchPhraseWithheld } from "#core/functions/search-phrase-withheld.function";
import { searchRulesOf } from "#core/functions/search-rules-of.function";
import { searchSnippetOf } from "#core/functions/search-snippet-of.function";
import { searchSynonymsOf } from "#core/functions/search-synonyms-of.function";
import { searchWhenHolds } from "#core/functions/search-when-holds.function";
import { searchWordsOf } from "#core/functions/search-words-of.function";
import { SearchSettings } from "#core/search.settings";
import type { SearchFacetOptions } from "#core/types/search-facet-options.type";
import type { SearchFindOptions } from "#core/types/search-find-options.type";
import type { SearchPageOptions } from "#core/types/search-page-options.type";
import type { SearchReindexOptions } from "#core/types/search-reindex-options.type";
import type { SearchSimilarOptions } from "#core/types/search-similar-options.type";
import type { SearchSuggestOptions } from "#core/types/search-suggest-options.type";
import type { SearchSuggestions } from "#core/types/search-suggestions.type";

/** The session's granted scope paths, `null` outside a scope session. */
const SCOPE_PATHS = z.array(z.object({ paths: z.string().nullable() }));

/** The session's own scope node, `null` (or empty) outside a scope session. */
const SESSION_SCOPE = z.array(z.object({ id: z.string().nullish(), path: z.string().nullish() }));

/** Rows per read when none is asked for. */
const DEFAULT_LIMIT = 20;

/** The most rows one read returns. */
const MAX_LIMIT = 100;

/** The most phrase words a search uses: a longer phrase is cut, which bounds the query one input can cause. */
const MAX_WORDS = 32;

/** The highest index version, as `t.searchable` allows. */
const MAX_VERSION = 999;

/** The most sort keys one read takes. */
const MAX_SORTS = 3;

/** The most values an any-of filter takes. */
const MAX_ANY_OF = 50;

/** The bound names of a range. */
const RANGE_BOUNDS = ["gte", "gt", "lte", "lt"] as const;

/** The narrowing of a read beyond its words: exact and any-of filters, ranges and sort keys. */
type Narrowing = Pick<SearchRequest, "filters" | "anyOf" | "ranges" | "sort">;

/** Rows per batch of `reindex`. */
const REINDEX_BATCH = 500;

/** A cursor: the next page's offset in decimal digits. */
const CURSOR = /^(0|[1-9]\d{0,8})$/;

/** Field kinds that are not relations, so a dotted path through them needs no populate. */
const NOT_RELATIONS: ReadonlySet<string> = new Set(["scalar", "embedded"]);

/**
 * The offset a cursor stands for.
 *
 * @throws SearchCursorInvalidError for a cursor no page gave.
 */
function offsetOf(cursor: string | undefined): number {
  if (cursor === undefined) return 0;
  if (!CURSOR.test(cursor))
    throw SearchCursorInvalidError.create({}, { fieldErrors: { cursor: "search_cursor_invalid" } });
  return Number(cursor);
}

/**
 * One model's index.
 *
 * @example
 * const page = await search.in(Product).page(input.q, {
 *   filters: { status: ProductStatus.Active },
 *   cursor: input.cursor,
 *   limit: input.limit,
 *   populate: ["variants"],
 * });
 */
export class SearchIndex<M extends object> {
  /** The engine. */
  private readonly driver: SearchDriver;

  /** The connected database whose running context every call uses. */
  private readonly database: Database;

  /** The model searched. */
  private readonly model: AnyClass<M>;

  /** The model's `@Searchable` facet. */
  private readonly facet: SearchableOptions;

  /** The reader of the synonym sets, ranking rules and query sample; none applies when absent. */
  private readonly settings: SettingsReader | undefined;

  /** The query log sampled reads and clicks go to, and completions come from; none when absent. */
  private readonly queries: SearchQueryLog | undefined;

  /**
   * @param driver - the engine.
   * @param database - the connected database.
   * @param model - a model class with a `@Searchable` facet.
   * @param settings - the reader `SearchSettings` (synonyms, ranking rules, query sample) is read through; none apply
   *   without one.
   * @param queries - the query log; no read is logged and no completion offered without one.
   * @throws TypeError when the model has no `@Searchable` facet.
   */
  constructor(
    driver: SearchDriver,
    database: Database,
    model: AnyClass<M>,
    settings?: SettingsReader,
    queries?: SearchQueryLog,
  ) {
    const facet = Searchable.on(model);
    if (facet === undefined)
      throw new TypeError(`${model.name} is not @Searchable, so it has no search index`);
    this.driver = driver;
    this.database = database;
    this.model = model;
    this.facet = facet;
    this.settings = settings;
    this.queries = queries;
  }

  /**
   * The best rows for `phrase`, up to `limit`.
   *
   * @throws RangeError for a limit that is not a whole number from 1 to 100.
   * @throws TypeError for a filter path the facet does not list.
   */
  async find(phrase: string, options: SearchFindOptions<M> = {}): Promise<M[]> {
    return (await this.read(phrase, 0, options, false)).items;
  }

  /**
   * The rows whose passages mean the closest to `phrase`, best first, up to `limit`: a semantic read by the vector
   * lane alone, under the same filters, visibility and scope session as `find`.
   *
   * @throws TypeError when the model is not `@Searchable({ semantic: true })`, the driver does not fuse vectors, or
   *         for a filter path the facet does not list.
   * @throws RangeError for a limit that is not a whole number from 1 to 100.
   * @example
   * const notes = await search.in(CaseNote).similar("customer disputes the invoice", { embedder: this.embedder });
   */
  async similar(phrase: string, options: SearchSimilarOptions<M>): Promise<M[]> {
    if (this.facet.semantic !== true)
      throw new TypeError(
        `${this.model.name} is not @Searchable({ semantic: true }), so it has no passages`,
      );
    if (!this.driver.fusesVectors)
      throw new TypeError(
        `The search driver does not rank by vectors, so ${this.model.name} has no semantic read`,
      );
    return (await this.read(phrase, 0, options, true)).items;
  }

  /**
   * One page of the best rows for `phrase`, with the cursor of the next page while there is one.
   *
   * @throws SearchCursorInvalidError for a cursor no page gave.
   * @throws RangeError for a limit that is not a whole number from 1 to 100.
   * @throws TypeError for a filter path the facet does not list.
   */
  async page(phrase: string, options: SearchPageOptions<M> = {}): Promise<TablePage<M>> {
    return this.read(phrase, offsetOf(options.cursor), options, false);
  }

  /**
   * How many rows matching `phrase` and `options.filters` hold each value of each of `options.paths`, under the same
   * record visibility a ranked read applies; an empty phrase counts every indexed row that holds the filters.
   *
   * @throws RangeError for a limit that is not a whole number from 1 to 100.
   * @throws TypeError for a path or filter the facet does not list.
   * @example
   * const facets = await search.in(Product).facets(input.q, { paths: ["status"], filters: { brand: "acme" } });
   * // { status: { active: 12, draft: 3 } }
   */
  async facets(phrase: string, options: SearchFacetOptions): Promise<SearchFacets> {
    const limit = this.limitOf(options.limit);
    this.checkFilters(options.paths);
    const { filters, anyOf, ranges } = this.narrowingOf(options);
    const visible = await visibleKeysQuery(this.model);
    const settings = await this.settingsOf();
    const { words, alternatives } = this.wordsOf(phrase, options.locale, options.arabizi, settings);
    const scopePaths = await this.scopePaths();
    return this.driver.facets(this.shape().table, {
      words,
      filters,
      ...(anyOf === undefined ? {} : { anyOf }),
      ...(ranges === undefined ? {} : { ranges }),
      paths: options.paths,
      limit,
      ...(Object.keys(alternatives).length === 0 ? {} : { alternatives }),
      ...(visible === undefined ? {} : { visible }),
      ...(scopePaths === undefined ? {} : { scopePaths }),
    });
  }

  /**
   * The excerpt of each row's own text fields around the phrase, by primary key, for a result list. A field whose data
   * class says `no_snippet` (`privileged`) is excerpted only for a member of the record's own team, which
   * `isTeamMember` answers (IAM's decision, never this index's); a row with nothing to show has no entry.
   *
   * @param locale - the locale a translated field is read in.
   */
  snippets(
    rows: readonly M[],
    phrase: string,
    options: { readonly locale?: string; readonly isTeamMember?: (row: M) => boolean } = {},
  ): ReadonlyMap<string, string> {
    const words = [...new Set(searchWordsOf(phrase))].slice(0, MAX_WORDS);
    const classes = Classify.members(this.model);
    const { key } = this.shape();
    const snippets = new Map<string, string>();
    for (const row of rows) {
      const isTeam = options.isTeamMember?.(row) ?? false;
      for (const path of this.facet.text) {
        if (path.includes(".")) continue;
        const restricted = classes.get(path)?.dataClass.search === SearchSnippet.NoSnippet;
        if (restricted && !isTeam) continue;
        const value = (row as Readonly<Record<string, unknown>>)[path];
        const text =
          value instanceof Translated
            ? value.in(options.locale ?? "")
            : typeof value === "string"
              ? value
              : "";
        const snippet = searchSnippetOf(text, words);
        if (snippet === undefined) continue;
        snippets.set(String(this.keyOf(row, key)), snippet);
        break;
      }
    }
    return snippets;
  }

  /**
   * Logs a click on result `id` of a read for `phrase` to the query log, sampled like the reads; nothing without a
   * log. The log write is never awaited.
   *
   * @example
   * await search.in(Product).clicked(input.q, input.productId);
   */
  async clicked(phrase: string, id: string): Promise<void> {
    const words = [...new Set(searchWordsOf(phrase))].slice(0, MAX_WORDS);
    if (words.length > 0) await this.log(phrase, words, await this.settingsOf(), { clicked: id });
  }

  /**
   * Suggestions for `prefix` (a search box as the user types): the logged phrases that complete it, and, when it finds
   * no row, the phrase with each word swapped for its closest indexed word (did-you-mean), from rows the caller may
   * see.
   *
   * @throws RangeError for a limit that is not a whole number from 1 to 100.
   * @example
   * const { completions, didYouMean } = await search.in(Product).suggest("linnen sh");
   */
  async suggest(prefix: string, options: SearchSuggestOptions = {}): Promise<SearchSuggestions> {
    const limit = this.limitOf(options.limit);
    const words = [...new Set(searchWordsOf(prefix))].slice(0, MAX_WORDS);
    if (words.length === 0) return { completions: [] };
    const completions =
      this.queries === undefined
        ? []
        : await this.queries.popular(this.model.name, words.join(" "), limit);
    const visible = await visibleKeysQuery(this.model);
    const scopePaths = await this.scopePaths();
    const narrowing = {
      ...(visible === undefined ? {} : { visible }),
      ...(scopePaths === undefined ? {} : { scopePaths }),
    };
    const { table } = this.shape();
    const found = await this.driver.search(table, {
      words,
      filters: {},
      offset: 0,
      limit: 1,
      ...narrowing,
    });
    if (found.length > 0) return { completions };
    const neighbours = await this.driver.neighbours(table, { words, limit: 1, ...narrowing });
    const corrected = words.map((word) => neighbours[word]?.[0] ?? word).join(" ");
    return corrected === words.join(" ") ? { completions } : { completions, didYouMean: corrected };
  }

  /** Stores the current document of each row, loading the relations the facet's paths walk first. */
  async index(rows: readonly M[]): Promise<void> {
    await this.store(rows, undefined);
  }

  /**
   * Readies version `version` of this index for a rebuild (ADR 0221 d7): from now on every write also reaches it, and
   * `reindex({ version })` fills it while reads stay on the live index.
   *
   * @throws RangeError for a version that is not a whole number from 2 to 999.
   * @throws TypeError when the driver keeps no versions, or (Postgres) the version's shadow columns do not exist.
   */
  async prepare(version: number): Promise<void> {
    await this.driver.prepare(this.versioned(version), version);
  }

  /**
   * Makes the rebuilt version `version` the live index at once; on Postgres, which swaps by its contract migration,
   * this only checks the version's columns exist.
   *
   * @throws RangeError for a version that is not a whole number from 2 to 999.
   * @throws TypeError when the driver keeps no versions, or `version` was not readied.
   */
  async swap(version: number): Promise<void> {
    await this.driver.swap(this.versioned(version), version);
  }

  /** Removes the documents of `ids` (an erasure, or a row hidden from search). */
  async remove(ids: readonly string[]): Promise<void> {
    if (ids.length > 0) await this.driver.remove(this.shape().table, ids);
  }

  /**
   * Indexes every row the caller's scope session can see, in primary key order, in batches; the backfill after
   * `t.searchable(...)` added the columns, or after the facet changed. `after` resumes a stopped run, `since` limits it
   * to rows updated since then (a partial reindex), `version` writes into a readied version instead of the live index,
   * and `onBatch` sees each stored batch with its cursor.
   *
   * @throws RangeError for a version that is not a whole number from 2 to 999.
   *
   * @returns how many rows were indexed.
   */
  async reindex(options: SearchReindexOptions<M> = {}): Promise<number> {
    if (options.version !== undefined) this.versioned(options.version);
    const { key } = this.shape();
    let count = 0;
    let after: unknown = options.after;
    const since = options.since === undefined ? {} : { updatedAt: { $gte: options.since } };
    // shortcut: the rows stay in the context's identity map; the reindex job runs it in its own context, and forks per
    // batch if a table outgrows the job's memory.
    for (;;) {
      const rows = await this.database
        .em()
        // reason: a filter and an order on the primary key named at run time, which MikroORM's types cannot follow
        .find(
          this.model,
          { ...since, ...(after === undefined ? {} : { [key]: { $gt: after } }) } as never,
          { orderBy: { [key]: "asc" } as never, limit: REINDEX_BATCH },
        );
      const last = rows.at(-1);
      if (last === undefined) return count;
      await this.store(rows, options.version);
      count += rows.length;
      after = this.keyOf(last, key);
      await options.onBatch?.(rows, String(after));
    }
  }

  /** Stores the documents of `rows` in the live index, or in `version` alone. */
  private async store(rows: readonly M[], version: number | undefined): Promise<void> {
    if (rows.length === 0) return;
    const relations = this.relations();
    // reason: populate types its hints from the entity type; the facet's paths are strings checked by gen
    if (relations.length > 0) await this.database.em().populate([...rows], relations as never);
    const { table: live, key } = this.shape();
    const table = version === undefined ? live : { ...live, version };
    // A row the facet's `when` refuses has no document, so a change that makes it unsearchable removes it.
    const searchable = rows.filter((row) => searchWhenHolds(row, this.facet));
    const hidden = rows
      .filter((row) => !searchWhenHolds(row, this.facet))
      .map((row) => String(this.keyOf(row, key)));
    if (hidden.length > 0) await this.driver.remove(table, hidden);
    if (searchable.length > 0)
      await this.driver.index(
        table,
        searchable.map((row) => searchDocumentOf(row, String(this.keyOf(row, key)), this.facet)),
      );
  }

  /**
   * The table addressed at `version`.
   *
   * @throws RangeError for a version that is not a whole number from 2 to 999.
   */
  private versioned(version: number): SearchTable {
    if (!Number.isInteger(version) || version < 2 || version > MAX_VERSION)
      throw new RangeError(
        `A search index version is a whole number from 2 to ${MAX_VERSION}, got ${version}`,
      );
    return { ...this.shape().table, version };
  }

  /**
   * One ranked read from `offset`: lexical, hybrid when the options carry an embedder the index can use, or the
   * vector lane alone when `semantic`.
   */
  private async read(
    phrase: string,
    offset: number,
    options: SearchFindOptions<M>,
    semantic: boolean,
  ): Promise<TablePage<M>> {
    const started = Date.now();
    const limit = this.limitOf(options.limit);
    const narrowing = this.narrowingOf(options);
    const settings = await this.settingsOf();
    const { words, alternatives } = this.wordsOf(phrase, options.locale, options.arabizi, settings);
    if (words.length === 0) return { items: [], hasMore: false };
    const rules = this.rulesOf(words, settings);
    const vector =
      options.embedder !== undefined && this.facet.semantic === true && this.driver.fusesVectors
        ? await this.vectorOf(words, options.embedder)
        : undefined;
    const visible = await visibleKeysQuery(this.model);
    const scopePaths = await this.scopePaths();
    const { table, key } = this.shape();
    const ids = await this.driver.search(table, {
      words: semantic ? [] : words,
      ...narrowing,
      offset,
      limit: limit + 1,
      ...(vector === undefined ? {} : { vector }),
      ...(Object.keys(alternatives).length === 0 ? {} : { alternatives }),
      ...(visible === undefined ? {} : { visible }),
      ...(scopePaths === undefined ? {} : { scopePaths }),
      ...rules,
    });
    const items = await this.load(ids.slice(0, limit), key, options.populate);
    await this.log(phrase, words, settings, {
      hits: items.length,
      latencyMs: Date.now() - started,
    });
    return ids.length > limit
      ? { items, hasMore: true, nextCursor: String(offset + limit) }
      : { items, hasMore: false };
  }

  /**
   * The vector lane of a read: the phrase's words embedded (the fold the passages were embedded from) and the metadata
   * of this index's passages.
   *
   * @throws RangeError when the embedder returns no vector for the phrase.
   */
  private async vectorOf(words: readonly string[], embedder: Embedder): Promise<SearchVector> {
    const [values] = await embedder.embed([words.join(" ")]);
    if (values === undefined || values.length === 0)
      throw new RangeError(`The embedder returned no vector for a ${this.model.name} search`);
    return { values, passages: { source: SEMANTIC_SOURCE, model: this.model.name } };
  }

  /**
   * The scope paths of the running scope session, for an engine that does not isolate scopes in the database:
   * `undefined` for an engine that does, or outside a scope session (a platform read); `[]` when the session was
   * granted no scope.
   */
  private async scopePaths(): Promise<readonly string[] | undefined> {
    if (this.driver.isolatesScopes) return undefined;
    // raw-sql: the scope session lives in transaction settings, which only `current_setting` reads
    const [row] = SCOPE_PATHS.parse(
      await this.database
        .em()
        .execute("select current_setting('app.scope_paths', true) as paths", []),
    );
    const paths = row?.paths ?? null;
    if (paths === null) return undefined;
    return paths === "" ? [] : paths.split("|");
  }

  /**
   * `limit`, or the default when absent.
   *
   * @throws RangeError for a limit that is not a whole number from 1 to 100.
   */
  private limitOf(limit: number = DEFAULT_LIMIT): number {
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT)
      throw new RangeError(`A search limit is a whole number from 1 to ${MAX_LIMIT}, got ${limit}`);
    return limit;
  }

  /**
   * The request narrowing of `options`: each filter split into an exact value or an any-of list, the ranges and the
   * sort keys, each path checked against the facet.
   *
   * @throws TypeError for a path the facet does not list for its kind, an empty or oversized any-of list, a range
   *         with no bound or with bounds of mixed types, more than three sort keys, or any of these on a driver whose
   *         `fieldKinds` is false.
   */
  private narrowingOf(options: {
    readonly filters?:
      | Readonly<Record<string, SearchFilterValue | readonly SearchFilterValue[]>>
      | undefined;
    readonly ranges?: Readonly<Record<string, SearchRange>> | undefined;
    readonly sort?: SearchSort | readonly SearchSort[] | undefined;
  }): Narrowing {
    const filters: Record<string, SearchFilterValue> = {};
    const anyOf: Record<string, readonly SearchFilterValue[]> = {};
    for (const [path, value] of Object.entries(options.filters ?? {})) {
      if (!Array.isArray(value)) {
        filters[path] = value as SearchFilterValue;
        continue;
      }
      const values = [...new Set(value as readonly SearchFilterValue[])];
      if (values.length === 0 || values.length > MAX_ANY_OF)
        throw new TypeError(
          `A ${this.model.name} search filter on ${path} takes 1 to ${MAX_ANY_OF} values, got ${values.length}`,
        );
      if (values.length === 1) filters[path] = values[0] as SearchFilterValue;
      else anyOf[path] = values;
    }
    this.checkFilters(Object.keys(options.filters ?? {}));
    const ranges = options.ranges ?? {};
    for (const [path, range] of Object.entries(ranges)) {
      this.checkKind(path, this.facet.ranges, "ranges");
      const types = new Set(
        RANGE_BOUNDS.flatMap((bound) => (range[bound] === undefined ? [] : [typeof range[bound]])),
      );
      if (types.size !== 1)
        throw new TypeError(
          `A ${this.model.name} search range on ${path} takes at least one bound, all numbers or all ISO strings`,
        );
    }
    const sort =
      options.sort === undefined
        ? []
        : Array.isArray(options.sort)
          ? (options.sort as readonly SearchSort[])
          : [options.sort as SearchSort];
    if (sort.length > MAX_SORTS)
      throw new TypeError(`A ${this.model.name} search sorts by at most ${MAX_SORTS} keys`);
    for (const key of sort) this.checkKind(key.path, this.facet.sortable, "sortable");
    const kinds = Object.keys(anyOf).length + Object.keys(ranges).length + sort.length;
    if (kinds > 0 && !this.driver.fieldKinds)
      throw new TypeError(
        `The search driver does not apply any-of filters, ranges or sort keys, so ${this.model.name} cannot be read with them`,
      );
    return {
      filters,
      ...(Object.keys(anyOf).length === 0 ? {} : { anyOf }),
      ...(Object.keys(ranges).length === 0 ? {} : { ranges }),
      ...(sort.length === 0 ? {} : { sort }),
    };
  }

  /**
   * Refuses a path the facet does not list under `kind`.
   *
   * @throws TypeError when `declared` lacks `path`.
   */
  private checkKind(path: string, declared: readonly string[] | undefined, kind: string): void {
    if (!(declared ?? []).includes(path))
      throw new TypeError(
        `${this.model.name} does not take ${path} in ${kind}; its @Searchable ${kind} are: ${(declared ?? []).join(", ") || "none"}`,
      );
  }

  /**
   * Refuses a filter path the facet does not list.
   *
   * @throws TypeError for the first such path.
   */
  private checkFilters(paths: readonly string[]): void {
    const declared = this.facet.filters ?? [];
    for (const path of paths)
      if (!declared.includes(path))
        throw new TypeError(
          `${this.model.name} does not filter on ${path}; its @Searchable filters are: ${declared.join(", ") || "none"}`,
        );
  }

  /**
   * The phrase's distinct normalised words, capped, and each word's alternatives: its Arabic spelling when it is
   * Arabizi and `arabizi` is not `false`, and the other words of the index's synonym sets in `locale`'s language
   * (every language when absent).
   */
  private wordsOf(
    phrase: string,
    locale: string | undefined,
    arabizi: boolean | undefined,
    settings: SearchSettings | undefined,
  ): {
    readonly words: readonly string[];
    readonly alternatives: Readonly<Record<string, readonly string[]>>;
  } {
    const words = [...new Set(searchWordsOf(phrase))].slice(0, MAX_WORDS);
    const synonyms = this.synonymsOf(words, locale, settings);
    const alternatives = Object.fromEntries(
      words.flatMap((word) => {
        const arabic = arabizi === false ? undefined : arabiziOf(word);
        const others = [
          ...new Set([...(arabic === undefined ? [] : [arabic]), ...(synonyms.get(word) ?? [])]),
        ];
        return others.length === 0 ? [] : [[word, others]];
      }),
    );
    return { words, alternatives };
  }

  /** The synonym sets of this index in `locale`'s language; none without settings or a word. */
  private synonymsOf(
    words: readonly string[],
    locale: string | undefined,
    settings: SearchSettings | undefined,
  ): ReadonlyMap<string, readonly string[]> {
    if (settings === undefined || settings.synonyms === "" || words.length === 0) return new Map();
    return searchSynonymsOf(
      settings.synonyms,
      this.indexNames(),
      locale?.split("-")[0]?.toLowerCase(),
    );
  }

  /** The search settings of the running scope; `undefined` without a settings reader. */
  private async settingsOf(): Promise<SearchSettings | undefined> {
    return this.settings === undefined ? undefined : this.settings.get(SearchSettings);
  }

  /** The names the index answers to in settings: its table, bare and schema-qualified. */
  private indexNames(): readonly string[] {
    const { table } = this.shape();
    return table.schema === undefined
      ? [table.table]
      : [table.table, `${table.schema}.${table.table}`];
  }

  /**
   * The ranking rules of `words` as request fields, for a driver that applies them; none without settings, rules or
   * such a driver.
   */
  private rulesOf(
    words: readonly string[],
    settings: SearchSettings | undefined,
  ): Pick<SearchRequest, "pinned" | "hidden" | "boosts" | "recency"> {
    if (settings === undefined || settings.rules === "" || !this.driver.appliesRules) return {};
    const { pinned, hidden, boosts, recency } = searchRulesOf(
      settings.rules,
      this.indexNames(),
      words,
    );
    return {
      ...(pinned.length === 0 ? {} : { pinned }),
      ...(hidden.length === 0 ? {} : { hidden }),
      ...(boosts.length === 0 ? {} : { boosts }),
      ...(recency === undefined ? {} : { recency }),
    };
  }

  /**
   * Logs a read or click of `phrase` when a query log is set and the sample (`search.querySample`) picks it. The
   * phrase is withheld (`null`) when the facet's text holds a classified field or the phrase looks personal. The
   * session's scope is read here; the log write is handed off and never awaited, so it never holds up the read, and
   * a failed write is dropped (analytics, never data the read depends on).
   */
  private async log(
    phrase: string,
    words: readonly string[],
    settings: SearchSettings | undefined,
    entry: { readonly hits?: number; readonly latencyMs?: number; readonly clicked?: string },
  ): Promise<void> {
    const sample = settings?.querySample ?? 0;
    if (this.queries === undefined || sample <= 0 || Math.random() >= sample) return;
    const classes = Classify.members(this.model);
    const classified = this.facet.text.some((path) => classes.has(path.split(".")[0] ?? ""));
    const scope = await this.sessionScope();
    void this.queries
      .record({
        model: this.model.name,
        phrase: classified || searchPhraseWithheld(phrase) ? null : words.join(" "),
        ...entry,
        ...(scope === undefined ? {} : { scope }),
      })
      .catch(() => undefined);
  }

  /** The running scope session's own node; `undefined` outside a scope session. */
  private async sessionScope(): Promise<ScopeRef | undefined> {
    // raw-sql: the scope session lives in transaction settings, which only `current_setting` reads
    const [row] = SESSION_SCOPE.parse(
      await this.database
        .em()
        .execute(
          "select current_setting('app.scope_id', true) as id, current_setting('app.scope_path', true) as path",
          [],
        ),
    );
    const id = row?.id ?? "";
    const path = row?.path ?? "";
    return id === "" || path === "" ? undefined : { id: id as PublicId<"scp">, path };
  }

  /** The rows of `ids`, in that order; a row the session cannot see any more is left out. */
  private async load(
    ids: readonly string[],
    key: string,
    populate: readonly string[] | undefined,
  ): Promise<M[]> {
    if (ids.length === 0) return [];
    const rows = await this.database
      .em()
      // reason: a filter on the primary key named at run time, and populate hints the caller typed as keys of M
      .find(
        this.model,
        { [key]: { $in: [...ids] } } as never,
        populate === undefined ? {} : { populate: [...populate] as never },
      );
    const byId = new Map<string, M>(rows.map((row) => [String(this.keyOf(row, key)), row]));
    return ids.flatMap((id) => byId.get(id) ?? []);
  }

  /** The table and primary key the driver addresses, from the model's ORM metadata. */
  private shape(): { readonly table: SearchTable; readonly key: string } {
    const meta = this.database.em().getMetadata(this.model);
    const [key] = meta.primaryKeys;
    const column = key === undefined ? undefined : meta.properties[key]?.fieldNames[0];
    if (key === undefined || column === undefined || meta.primaryKeys.length > 1)
      throw new TypeError(`${this.model.name} has no single-column primary key to index by`);
    return {
      key,
      table: {
        ...(meta.schema === undefined ? {} : { schema: meta.schema }),
        table: meta.tableName,
        primaryKey: column,
      },
    };
  }

  /** The relations the facet's dotted paths walk, as populate hints. */
  private relations(): readonly string[] {
    const meta = this.database.em().getMetadata(this.model);
    const hints = searchPathsOf(this.facet)
      .filter((path) => path.includes("."))
      .filter((path) => {
        const kind = meta.properties[path.split(".")[0] as keyof typeof meta.properties]?.kind;
        return kind !== undefined && !NOT_RELATIONS.has(String(kind));
      })
      .map((path) => path.slice(0, path.lastIndexOf(".")));
    return [...new Set(hints)];
  }

  /** The primary key value of `row`. */
  private keyOf(row: M, key: string): unknown {
    return (row as Readonly<Record<string, unknown>>)[key];
  }
}
