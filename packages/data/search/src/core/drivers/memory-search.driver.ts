/**
 * Stackra file contract:
 * Purpose: the in-memory `SearchDriver` for tests and `driver: "memory"`: documents held in a `Map` per table for the
 *          life of the container, ranked by field weight with every word required.
 * Boundary: the memory driver every capability ships first (ADR 0266); isomorphic, so it ships from `.`. A word
 *           matches a document when it starts one of its words (weighted by the field's position, as Postgres weighs
 *           A to D) or, failing that, appears inside its text (weighted lowest), so a SKU fragment still finds its row.
 *           Ties rank by id. A word also matches as any of its alternatives. It refuses a request that
 *           carries record visibility, which it cannot apply. It sees every document it was given: row-level security applies only when the rows are
 *           loaded afterwards. Nothing survives a restart, so `reindex` refills it.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decisions 1 and 9); ADR 0266 (memory drivers first); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";

import { SearchDriver } from "#contracts/index";
import type { SearchDocument, SearchRequest, SearchTable } from "#contracts/index";
import { searchWordsOf } from "#core/functions/search-words-of.function";

/** One stored document: each field's words, all its text, and its filter values. */
interface StoredDocument {
  readonly fields: readonly (readonly string[])[];
  readonly text: string;
  readonly filters: SearchDocument["filters"];
}

/** The score of a word that starts a word of field 0, 1, 2 and 3 or later; a word only inside the text scores 1. */
const WEIGHTS: readonly number[] = [8, 6, 4, 2];

/** The key of a table's documents. */
const keyOf = (table: SearchTable): string => `${table.schema ?? ""}.${table.table}`;

/** All the words of one field, every locale's included. */
const wordsOf = (field: SearchDocument["fields"][number]): readonly string[] =>
  searchWordsOf(typeof field === "string" ? field : Object.values(field).join(" "));

/** The best score of one spelling of a word in `document`; 0 when it does not occur. */
function wordScoreOf(document: StoredDocument, word: string): number {
  const field = document.fields.findIndex((tokens) =>
    tokens.some((token) => token.startsWith(word)),
  );
  if (field >= 0) return WEIGHTS[Math.min(field, WEIGHTS.length - 1)] ?? 0;
  return document.text.includes(word) ? 1 : 0;
}

/** The score of `document` for `request`'s words, each matched by itself or an alternative; 0 when one misses. */
function scoreOf(document: StoredDocument, request: SearchRequest): number {
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
 * const search = new Search(new MemorySearchDriver(), database);
 * await search.in(Product).index(products);
 */
export class MemorySearchDriver extends Driver(SearchDriver) {
  /** Documents by table key, then by id. */
  private readonly tables = new Map<string, Map<string, StoredDocument>>();

  /**
   * See `SearchDriver.search`.
   *
   * @throws TypeError when the request carries a visibility subquery, which only a SQL engine can apply.
   */
  async search(table: SearchTable, request: SearchRequest): Promise<readonly string[]> {
    if (request.visible !== undefined)
      throw new TypeError(
        "The memory search driver cannot apply record visibility; use the postgres driver",
      );
    const filters = Object.entries(request.filters);
    const hits: { readonly id: string; readonly score: number }[] = [];
    for (const [id, document] of this.tables.get(keyOf(table)) ?? []) {
      if (!filters.every(([path, value]) => document.filters[path]?.includes(value) === true))
        continue;
      const score = scoreOf(document, request);
      if (score > 0) hits.push({ id, score });
    }
    hits.sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    return hits.slice(request.offset, request.offset + request.limit).map((hit) => hit.id);
  }

  /** See `SearchDriver.index`. */
  async index(table: SearchTable, documents: readonly SearchDocument[]): Promise<void> {
    const key = keyOf(table);
    const stored = this.tables.get(key) ?? new Map<string, StoredDocument>();
    this.tables.set(key, stored);
    for (const document of documents) {
      const fields = document.fields.map(wordsOf);
      stored.set(document.id, {
        fields,
        text: fields.flat().join(" "),
        filters: document.filters,
      });
    }
  }

  /** See `SearchDriver.remove`. */
  async remove(table: SearchTable, ids: readonly string[]): Promise<void> {
    const stored = this.tables.get(keyOf(table));
    for (const id of ids) stored?.delete(id);
  }
}
