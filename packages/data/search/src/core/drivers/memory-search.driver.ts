/**
 * Stackra file contract:
 * Purpose: the in-memory `SearchDriver` for tests and `driver: "memory"`: documents held in a `Map` per table for the
 *          life of the container, ranked by field weight with every word required.
 * Boundary: the memory driver every capability ships first (ADR 0266); isomorphic, so it ships from `.`. A word
 *           matches a document when it starts one of its words (weighted by the field's position, as Postgres weighs
 *           A to D) or, failing that, appears inside its text (weighted lowest), so a SKU fragment still finds its row.
 *           Ties rank by id. A word also matches as any of its alternatives. A document's `weights` replace its fields'
 *           positions as their tiers; any-of filters, ranges (numbers against number bounds, ISO strings against string
 *           bounds) and sort keys (a document's first value, a missing one last) apply as the port describes. It refuses a request that
 *           carries record visibility, which it cannot apply. It keeps every document it was given, with its scope, and
 *           answers only the documents within a request's `scopePaths` (and those without a scope), so its matches,
 *           pages and facet counts never cross scopes. Nothing survives a restart, so `reindex` refills it. It keeps one
 *           shadow version per table between `prepare` and `swap` (the alias swap an engine does), written beside the
 *           live index and readable by version.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decisions 1 and 9); ADR 0266 (memory drivers first); ADR 0294 (decision 16); ADR 0089
 *                     (decision 6: every query scoped); stackra-303 (versions); stackra-302 (field kinds).
 */
import { Driver } from "@stackra/container";

import { SearchDriver } from "#contracts/index";
import type {
  SearchDocument,
  SearchFacetRequest,
  SearchFacets,
  SearchFilterValue,
  SearchRange,
  SearchRequest,
  SearchSort,
  SearchTable,
} from "#contracts/index";
import { searchWordsOf } from "#core/functions/search-words-of.function";

/** One stored document: each field's words and weight tier, all its text, its filter values and its scope path. */
interface StoredDocument {
  readonly fields: readonly (readonly string[])[];
  readonly tiers: readonly number[];
  readonly text: string;
  readonly filters: SearchDocument["filters"];
  readonly scopePath: string | undefined;
}

/** Whether a document under `path` (none for an unscoped row) is within one of `paths` (no limit when absent). */
function inScope(path: string | undefined, paths: readonly string[] | undefined): boolean {
  if (paths === undefined || path === undefined) return true;
  return paths.some((granted) => path === granted || path.startsWith(`${granted}.`));
}

/** Whether `value` lies within every bound of `range`, compared as numbers or as strings by the bound's type. */
function inRange(value: SearchFilterValue, range: SearchRange): boolean {
  const holds = (bound: number | string | undefined, test: (order: number) => boolean): boolean => {
    if (bound === undefined) return true;
    if (typeof bound !== typeof value) return false;
    return test(value < bound ? -1 : value > bound ? 1 : 0);
  };
  return (
    holds(range.gte, (order) => order >= 0) &&
    holds(range.gt, (order) => order > 0) &&
    holds(range.lte, (order) => order <= 0) &&
    holds(range.lt, (order) => order < 0)
  );
}

/** The order of two documents by one sort key: by their first value of its path, a missing value last. */
function compareSortValues(a: StoredDocument, b: StoredDocument, key: SearchSort): number {
  const x = a.filters[key.path]?.[0];
  const y = b.filters[key.path]?.[0];
  if (x === undefined || y === undefined) return x === y ? 0 : x === undefined ? 1 : -1;
  const order = x < y ? -1 : x > y ? 1 : 0;
  return key.direction === "desc" ? -order : order;
}

/** The score of a word that starts a word of field 0, 1, 2 and 3 or later; a word only inside the text scores 1. */
const WEIGHTS: readonly number[] = [8, 6, 4, 2];

/** The key of a table's documents. */
const keyOf = (table: SearchTable): string => `${table.schema ?? ""}.${table.table}`;

/** The store key of a shadow version of a table. */
const versionKeyOf = (key: string, version: number): string => `${key}#v${version}`;

/** All the words of one field, every locale's included. */
const wordsOf = (field: SearchDocument["fields"][number]): readonly string[] =>
  searchWordsOf(typeof field === "string" ? field : Object.values(field).join(" "));

/** The best score of one spelling of a word in `document`; 0 when it does not occur. */
function wordScoreOf(document: StoredDocument, word: string): number {
  const field = document.fields.findIndex((tokens) =>
    tokens.some((token) => token.startsWith(word)),
  );
  if (field >= 0) return WEIGHTS[Math.min(document.tiers[field] ?? field, WEIGHTS.length - 1)] ?? 0;
  return document.text.includes(word) ? 1 : 0;
}

/** The score of `document` for `request`'s words, each matched by itself or an alternative; 0 when one misses. */
function scoreOf(
  document: StoredDocument,
  request: Pick<SearchRequest, "words" | "alternatives">,
): number {
  let score = 0;
  for (const word of request.words) {
    const best = Math.max(
      ...[word, ...(request.alternatives?.[word] ?? [])].map((spelling) =>
        wordScoreOf(document, spelling),
      ),
    );
    if (best === 0) return 0;
    score += best;
  }
  return score;
}

/**
 * Holds documents in memory.
 *
 * @example
 * const search = new Search(new MemorySearchDriver(), database, settings);
 * await search.in(Product).index(products);
 */
export class MemorySearchDriver extends Driver(SearchDriver) {
  /** It applies any-of filters, ranges, sort keys and field weights. */
  override readonly fieldKinds: boolean = true;

  /** Documents by table key, then by id. */
  private readonly tables = new Map<string, Map<string, StoredDocument>>();

  /** The shadow version readied per table, until its swap. */
  private readonly readied = new Map<string, number>();

  /**
   * The ids of the rows of `table` that match `request`, best first, sliced by its offset and limit.
   *
   * @throws TypeError when the request carries a visibility subquery, which only a SQL engine can apply.
   */
  async search(table: SearchTable, request: SearchRequest): Promise<readonly string[]> {
    const hits = this.matching(table, request);
    const sort = request.sort ?? [];
    hits.sort(
      (a, b) =>
        sort.reduce((order, key) => order || compareSortValues(a.document, b.document, key), 0) ||
        b.score - a.score ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );
    return hits.slice(request.offset, request.offset + request.limit).map((hit) => hit.id);
  }

  /**
   * Per requested path, how many rows matching `request` hold each value, under its record visibility.
   *
   * @throws TypeError when the request carries a visibility subquery, which only a SQL engine can apply.
   */
  async facets(table: SearchTable, request: SearchFacetRequest): Promise<SearchFacets> {
    const hits = this.matching(table, request);
    return Object.fromEntries(
      request.paths.map((path) => {
        const counts = new Map<string, number>();
        for (const { document } of hits)
          for (const value of new Set(document.filters[path]?.map(String)))
            counts.set(value, (counts.get(value) ?? 0) + 1);
        // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
        const ranked = [...counts].sort(([a, x], [b, y]) => y - x || (a < b ? -1 : a > b ? 1 : 0));
        return [path, Object.fromEntries(ranked.slice(0, request.limit))];
      }),
    );
  }

  /**
   * Stores each document as its row's current one, replacing what was stored: in the live index and a readied shadow
   * version, or in `table.version`'s alone.
   */
  async index(table: SearchTable, documents: readonly SearchDocument[]): Promise<void> {
    for (const key of this.writtenOf(table)) {
      const stored = this.tables.get(key) ?? new Map<string, StoredDocument>();
      this.tables.set(key, stored);
      for (const document of documents) {
        const fields = document.fields.map(wordsOf);
        stored.set(document.id, {
          fields,
          tiers: fields.map((_, position) => document.weights?.[position] ?? position),
          text: fields.flat().join(" "),
          filters: document.filters,
          scopePath: document.scope?.path,
        });
      }
    }
  }

  /** Removes the documents of `ids` from the live index and a readied shadow (or `table.version`'s alone). */
  async remove(table: SearchTable, ids: readonly string[]): Promise<void> {
    for (const key of this.writtenOf(table)) {
      const stored = this.tables.get(key);
      for (const id of ids) stored?.delete(id);
    }
  }

  /** Starts an empty shadow index of `version`, which every later write also reaches until the swap. */
  override async prepare(table: SearchTable, version: number): Promise<void> {
    const key = keyOf(table);
    const readied = this.readied.get(key);
    if (readied !== undefined) this.tables.delete(versionKeyOf(key, readied));
    this.readied.set(key, version);
    this.tables.set(versionKeyOf(key, version), new Map());
  }

  /**
   * Makes the readied shadow of `version` the live index at once.
   *
   * @throws TypeError when `version` is not the readied one.
   */
  override async swap(table: SearchTable, version: number): Promise<void> {
    const key = keyOf(table);
    if (this.readied.get(key) !== version)
      throw new TypeError(`${key} has no readied index of version ${version} to swap to`);
    this.tables.set(key, this.tables.get(versionKeyOf(key, version)) ?? new Map());
    this.tables.delete(versionKeyOf(key, version));
    this.readied.delete(key);
  }

  /** The stores a write reaches: `table.version`'s, else the live one and the readied shadow. */
  private writtenOf(table: SearchTable): readonly string[] {
    const key = keyOf(table);
    if (table.version !== undefined) return [this.storeOf(table)];
    const readied = this.readied.get(key);
    return readied === undefined ? [key] : [key, versionKeyOf(key, readied)];
  }

  /**
   * The store a read or a versioned write addresses: the live one, or `table.version`'s.
   *
   * @throws TypeError when `table.version` is not the readied one.
   */
  private storeOf(table: SearchTable): string {
    const key = keyOf(table);
    if (table.version === undefined) return key;
    if (this.readied.get(key) !== table.version)
      throw new TypeError(`${key} has no readied index of version ${table.version}`);
    return versionKeyOf(key, table.version);
  }

  /**
   * The documents of `table` that hold every filter and match every word, with their scores; with no words, every
   * document that holds the filters (score 0).
   *
   * @throws TypeError when the request carries a visibility subquery.
   */
  private matching(
    table: SearchTable,
    request: Omit<SearchRequest, "offset" | "limit">,
  ): { readonly id: string; readonly score: number; readonly document: StoredDocument }[] {
    if (request.visible !== undefined)
      throw new TypeError(
        "The memory search driver cannot apply record visibility; use the postgres driver",
      );
    const filters = Object.entries(request.filters);
    const anyOf = Object.entries(request.anyOf ?? {});
    const ranges = Object.entries(request.ranges ?? {});
    const hits: {
      readonly id: string;
      readonly score: number;
      readonly document: StoredDocument;
    }[] = [];
    for (const [id, document] of this.tables.get(this.storeOf(table)) ?? []) {
      if (!inScope(document.scopePath, request.scopePaths)) continue;
      if (!filters.every(([path, value]) => document.filters[path]?.includes(value) === true))
        continue;
      if (
        !anyOf.every(([path, values]) =>
          values.some((value) => document.filters[path]?.includes(value) === true),
        )
      )
        continue;
      if (
        !ranges.every(([path, range]) =>
          (document.filters[path] ?? []).some((value) => inRange(value, range)),
        )
      )
        continue;
      if (request.words.length === 0) {
        hits.push({ id, score: 0, document });
        continue;
      }
      const score = scoreOf(document, request);
      if (score > 0) hits.push({ id, score, document });
    }
    return hits;
  }
}
