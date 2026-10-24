/**
 * Stackra file contract:
 * Purpose: `SearchIndex<M>`, one model's search index as `search.in(Model)` returns it: ranked `find` and cursor
 *          `page` reads that return loaded rows, and `index`, `remove` and `reindex`, which keep the documents current.
 * Boundary: a value built by `Search`, never injected. It reads the model's `@Searchable` facet and its ORM metadata,
 *           builds documents and phrase words (the one normalisation, ADR 0221 d3) and leaves ranking and storage to the
 *           driver. Every read and write runs on the running context's entity manager, so it joins the caller's
 *           transaction and scope session: row-level security decides which rows a search sees, and nothing here adds
 *           a filter of its own. A cursor is the next page's offset; a page past the driver's candidate window is empty.
 * Runtime: node
 * Governing contract: ADR 0221 (decisions 1, 2, 3 and 7); ADR 0294 (decision 6: `@Searchable` is a class facet);
 *                     cursor pagination in the HTTP conventions; ADR 0327 (decision 9: isolation in the database).
 */
import type { AnyClass } from "@stackra/container";
import type { Database, TablePage } from "@stackra/database";
import { Searchable } from "@stackra/model";
import type { SearchableOptions } from "@stackra/model";

import type { SearchDriver, SearchTable } from "#contracts/index";
import { SearchCursorInvalidError } from "#core/errors/search-cursor-invalid.error";
import { searchDocumentOf } from "#core/functions/search-document-of.function";
import { searchWordsOf } from "#core/functions/search-words-of.function";
import type { SearchFindOptions } from "#core/types/search-find-options.type";
import type { SearchPageOptions } from "#core/types/search-page-options.type";

/** Rows per read when none is asked for. */
const DEFAULT_LIMIT = 20;

/** The most rows one read returns. */
const MAX_LIMIT = 100;

/** The most phrase words a search uses: a longer phrase is cut, which bounds the query one input can cause. */
const MAX_WORDS = 32;

/** Rows per batch of `reindex`. */
const REINDEX_BATCH = 500;

/** A cursor: the next page's offset in decimal digits. */
const CURSOR = /^(0|[1-9]\d{0,8})$/;

/** Field kinds that are not relations, so a dotted path through them needs no populate. */
const NOT_RELATIONS: readonly string[] = ["scalar", "embedded"];

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

  /**
   * @param driver - the engine.
   * @param database - the connected database.
   * @param model - a model class with a `@Searchable` facet.
   * @throws TypeError when the model has no `@Searchable` facet.
   */
  constructor(driver: SearchDriver, database: Database, model: AnyClass<M>) {
    const facet = Searchable.on(model);
    if (facet === undefined)
      throw new TypeError(`${model.name} is not @Searchable, so it has no search index`);
    this.driver = driver;
    this.database = database;
    this.model = model;
    this.facet = facet;
  }

  /**
   * The best rows for `phrase`, up to `limit`.
   *
   * @throws RangeError for a limit that is not a whole number from 1 to 100.
   * @throws TypeError for a filter path the facet does not list.
   */
  async find(phrase: string, options: SearchFindOptions<M> = {}): Promise<M[]> {
    return (await this.read(phrase, 0, options)).items;
  }

  /**
   * One page of the best rows for `phrase`, with the cursor of the next page while there is one.
   *
   * @throws SearchCursorInvalidError for a cursor no page gave.
   * @throws RangeError for a limit that is not a whole number from 1 to 100.
   * @throws TypeError for a filter path the facet does not list.
   */
  async page(phrase: string, options: SearchPageOptions<M> = {}): Promise<TablePage<M>> {
    return this.read(phrase, offsetOf(options.cursor), options);
  }

  /** Stores the current document of each row, loading the relations the facet's paths walk first. */
  async index(rows: readonly M[]): Promise<void> {
    if (rows.length === 0) return;
    const relations = this.relations();
    // reason: populate types its hints from the entity type; the facet's paths are strings checked by gen
    if (relations.length > 0) await this.database.em().populate([...rows], relations as never);
    const { table, key } = this.shape();
    await this.driver.index(
      table,
      rows.map((row) => searchDocumentOf(row, String(this.keyOf(row, key)), this.facet)),
    );
  }

  /** Removes the documents of `ids` (an erasure, or a row hidden from search). */
  async remove(ids: readonly string[]): Promise<void> {
    if (ids.length > 0) await this.driver.remove(this.shape().table, ids);
  }

  /**
   * Indexes every row the caller's scope session can see, in primary key order, in batches; the backfill after
   * `t.searchable(...)` added the columns, or after the facet changed.
   *
   * @returns how many rows were indexed.
   */
  async reindex(): Promise<number> {
    const { key } = this.shape();
    let count = 0;
    let after: unknown;
    // shortcut: the rows stay in the context's identity map; run it as a job in its own context, and fork per batch
    // if a table outgrows the job's memory.
    for (;;) {
      const rows = await this.database
        .em()
        // reason: a filter and an order on the primary key named at run time, which MikroORM's types cannot follow
        .find(this.model, (after === undefined ? {} : { [key]: { $gt: after } }) as never, {
          orderBy: { [key]: "asc" } as never,
          limit: REINDEX_BATCH,
        });
      const last = rows.at(-1);
      if (last === undefined) return count;
      await this.index(rows);
      count += rows.length;
      after = this.keyOf(last, key);
    }
  }

  /** One ranked read from `offset`. */
  private async read(
    phrase: string,
    offset: number,
    options: SearchFindOptions<M>,
  ): Promise<TablePage<M>> {
    const limit = options.limit ?? DEFAULT_LIMIT;
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT)
      throw new RangeError(`A search limit is a whole number from 1 to ${MAX_LIMIT}, got ${limit}`);
    const filters = options.filters ?? {};
    const declared = this.facet.filters ?? [];
    for (const path of Object.keys(filters))
      if (!declared.includes(path))
        throw new TypeError(
          `${this.model.name} does not filter on ${path}; its @Searchable filters are: ${declared.join(", ") || "none"}`,
        );
    const words = [...new Set(searchWordsOf(phrase))].slice(0, MAX_WORDS);
    if (words.length === 0) return { items: [], hasMore: false };
    const { table, key } = this.shape();
    const ids = await this.driver.search(table, { words, filters, offset, limit: limit + 1 });
    const items = await this.load(ids.slice(0, limit), key, options.populate);
    return ids.length > limit
      ? { items, hasMore: true, nextCursor: String(offset + limit) }
      : { items, hasMore: false };
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
    const hints = [...this.facet.text, ...(this.facet.filters ?? [])]
      .filter((path) => path.includes("."))
      .filter((path) => {
        const kind = meta.properties[path.split(".")[0] as keyof typeof meta.properties]?.kind;
        return kind !== undefined && !NOT_RELATIONS.includes(String(kind));
      })
      .map((path) => path.slice(0, path.lastIndexOf(".")));
    return [...new Set(hints)];
  }

  /** The primary key value of `row`. */
  private keyOf(row: M, key: string): unknown {
    return (row as Readonly<Record<string, unknown>>)[key];
  }
}
