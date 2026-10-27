/**
 * Stackra file contract:
 * Purpose: `SemanticChangeService`, the outbox change consumer of every registered `@Searchable({ semantic: true })`
 *          model: a committed change of a row embeds its text fields through the `Embedder` and stores the passage in
 *          the `VectorIndex` (pgvector in Postgres); a deleted row, one the scope session no longer sees, or one with
 *          no text leaves the index. `index` and `remove` also serve a backfill job.
 * Boundary: a `ChangeConsumer` registered by `registerSearchableModels` beside `SearchableChangeService`, for semantic
 *           models only. It is `Lifetime.Transient`, so the container builds it, and with it the `Embedder` driver
 *           (which needs `search.embedder.url`), only when the relay resolves it for a semantic model's change, never
 *           at boot. The runtime `ai: never` guard (`semanticPassageOf`) runs before any text reaches the embedder, so
 *           a refused field is never sent. A passage's id is `<Model>:<primary key>`, unique across the shared vector
 *           table, with metadata `{ source: "search", model }`. Its scope is the row's own `scopeId` and `scopePath`
 *           (ADR 0327 decision 3), never request input; a semantic model without them is refused.
 * Runtime: node
 * Governing contract: ADR 0380 (decisions 2 and 3: the `ai: never` floor); ADR 0221 (decision 5: indexing through the
 *                     outbox); ADR 0160 (pgvector); ADR 0327 (decisions 3 and 9); ADR 0078 (decision 4: idempotent
 *                     consumers); ADR 0294 (decision 17: lifetimes); STA-1326.
 */
import { Lifetime, Service } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import type { PublicId, ScopeRef } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { Searchable } from "@stackra/model";
import { RowChangeKind } from "@stackra/outbox/contracts";
import type { ChangeConsumer, RowChange } from "@stackra/outbox/contracts";

import type { Embedder, VectorIndex, VectorItem } from "#contracts/index";
import { semanticPassageOf } from "#core/functions/semantic-passage-of.function";
import { SEARCHABLE_MODELS } from "#node/constants/searchable-models.constant";

/** The metadata `source` of every passage this service stores, so a retrieval can filter search passages in or out. */
const SOURCE = "search";

/** Field kinds that are not relations, so a dotted path through them needs no populate. */
const NOT_RELATIONS: readonly string[] = ["scalar", "embedded"];

/**
 * Keeps a semantic model's passages current.
 *
 * @example
 * registerSearchableModels([CaseNote]); // CaseNote is @Searchable({ text: ["body"], semantic: true })
 * // every committed CaseNote change now reaches consume(change), which embeds and stores its passage
 */
@Lifetime(Lifetime.Transient)
export class SemanticChangeService extends Service implements ChangeConsumer {
  /** Turns passages into vectors. */
  private readonly embedder: Embedder;

  /** Stores the vectors. */
  private readonly vectors: VectorIndex;

  /** The connected database whose running context loads the row. */
  private readonly database: Database;

  /**
   * @param embedder - the in-region embedder (`search.embedder`).
   * @param vectors - the vector index the passages go to.
   * @param database - the connected database.
   */
  constructor(embedder: Embedder, vectors: VectorIndex, database: Database) {
    super();
    this.embedder = embedder;
    this.vectors = vectors;
    this.database = database;
  }

  /** Embeds the changed row, or removes its passage when the row is gone. */
  async consume(change: RowChange): Promise<void> {
    const model = SEARCHABLE_MODELS.get(change.model);
    if (model === undefined || Searchable.on(model)?.semantic !== true) return;
    const row =
      change.kind === RowChangeKind.Deleted
        ? null
        : // reason: the serialised primary key of a model named at run time, which MikroORM's types cannot follow
          await this.database.em().findOne(model, change.id as never);
    await (row === null ? this.remove(model, [change.id]) : this.index(model, [row]));
  }

  /**
   * Embeds and stores the passage of each row, loading the relations the facet's text paths walk first; a row with
   * no text loses its passage.
   *
   * @throws TypeError when the model is not `@Searchable({ semantic: true })`, a text path ends at an `ai: never`
   *         field, or a row has no `scopeId` and `scopePath`.
   */
  async index(model: AnyClass, rows: readonly object[]): Promise<void> {
    const facet = Searchable.on(model);
    if (facet?.semantic !== true)
      throw new TypeError(`${model.name} is not @Searchable({ semantic: true })`);
    if (rows.length === 0) return;
    const em = this.database.em();
    const meta = em.getMetadata(model);
    const [key] = meta.primaryKeys;
    if (key === undefined || meta.primaryKeys.length > 1)
      throw new TypeError(`${model.name} has no single-column primary key to index by`);
    const relations = [
      ...new Set(
        facet.text
          .filter((path) => path.includes("."))
          .filter((path) => {
            const kind = meta.properties[path.split(".")[0] as keyof typeof meta.properties]?.kind;
            return kind !== undefined && !NOT_RELATIONS.includes(String(kind));
          })
          .map((path) => path.slice(0, path.lastIndexOf("."))),
      ),
    ];
    // reason: populate types its hints from the entity type; the facet's paths are strings checked by gen
    if (relations.length > 0) await em.populate([...rows], relations as never);
    // The ai: never guard runs on every row, and the scope check on every passage, before any text is embedded.
    const passages = rows.map((row) => ({
      row,
      id: String((row as Readonly<Record<string, unknown>>)[key]),
      text: semanticPassageOf(row, facet),
    }));
    const empty = passages.filter((passage) => passage.text === "");
    const full = passages.filter((passage) => passage.text !== "");
    if (empty.length > 0)
      await this.remove(
        model,
        empty.map((passage) => passage.id),
      );
    if (full.length === 0) return;
    const scopes = full.map((passage) => scopeOf(model, passage.row));
    const vectors = await this.embedder.embed(full.map((passage) => passage.text));
    const items: VectorItem[] = full.map((passage, at) => ({
      id: `${model.name}:${passage.id}`,
      scope: scopes[at] as ScopeRef,
      vector: vectors[at] ?? [],
      text: passage.text,
      metadata: { source: SOURCE, model: model.name },
    }));
    await this.vectors.upsert(items);
  }

  /** Removes the passages of `ids` (an erasure, a deleted row or a row hidden from search). */
  async remove(model: AnyClass, ids: readonly string[]): Promise<void> {
    if (ids.length > 0) await this.vectors.remove(ids.map((id) => `${model.name}:${id}`));
  }
}

/**
 * The scope node a row belongs to, from its own scope columns.
 *
 * @throws TypeError when the row has no string `scopeId` and `scopePath`.
 */
function scopeOf(model: AnyClass, row: object): ScopeRef {
  const { scopeId, scopePath } = row as {
    readonly scopeId?: unknown;
    readonly scopePath?: unknown;
  };
  if (typeof scopeId !== "string" || typeof scopePath !== "string")
    // shortcut: only rows with the ADR 0327 scope columns embed; read the scope from the change's message once the
    // relay hands it to consumers.
    throw new TypeError(
      `${model.name} is @Searchable({ semantic: true }) but its row has no scopeId and scopePath to own the passage`,
    );
  return { id: scopeId as PublicId<"scp">, path: scopePath };
}
