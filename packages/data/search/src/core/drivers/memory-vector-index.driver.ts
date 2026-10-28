/**
 * Stackra file contract:
 * Purpose: the in-memory `VectorIndex` for tests and development: items held in a `Map` for the life of the container,
 *          ranked by cosine similarity to the query.
 * Boundary: the memory driver every capability ships first (ADR 0266); isomorphic, so it ships from `.`. A query sees
 *           the items at or below its scope node, filtered by metadata equality, best first with ties by id, as the
 *           pgvector driver orders them. It compares every item (no approximate index) and has no row-level security
 *           of its own: the scope option is the only isolation. A zero vector scores 0; vectors of different lengths
 *           are refused. Nothing survives a restart.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0160; ADR 0294 (decision 16); owner decision 23; stackra-301 (`metadataOf`).
 */
import { Driver } from "@stackra/container";

import { VectorIndex } from "#contracts/index";
import type { VectorHit, VectorItem, VectorQueryOptions } from "#contracts/index";
import { checkVector } from "#core/functions/check-vector.function";

/**
 * The cosine similarity of `a` and `b`; 0 when either has no length.
 *
 * @throws TypeError when their lengths differ.
 */
function cosineOf(a: readonly number[], b: readonly number[]): number {
  if (a.length !== b.length)
    throw new TypeError(`Vectors of ${a.length} and ${b.length} numbers cannot be compared`);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < a.length; index++) {
    const x = a[index] ?? 0;
    const y = b[index] ?? 0;
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }
  return normA === 0 || normB === 0 ? 0 : dot / Math.sqrt(normA * normB);
}

/**
 * Holds vectors in memory.
 *
 * @example
 * const index = new MemoryVectorIndexDriver();
 * await index.upsert([{ id: "doc_1#0", scope, vector: [0.1, 0.9], text: "Returns within 30 days", metadata: {} }]);
 * await index.query([0.1, 0.8], { topK: 3, scope });
 */
export class MemoryVectorIndexDriver extends Driver(VectorIndex) {
  /** The items by id. */
  private readonly items = new Map<string, VectorItem>();

  /** Stores each item, replacing an item with the same id. */
  async upsert(items: readonly VectorItem[]): Promise<void> {
    for (const item of items) checkVector(item.vector);
    for (const item of items)
      this.items.set(item.id, Object.freeze({ ...item, vector: Object.freeze([...item.vector]) }));
  }

  /** The `topK` items nearest to `vector`, best first, within the scope and matching the filter. */
  async query(
    vector: readonly number[],
    options: VectorQueryOptions,
  ): Promise<readonly VectorHit[]> {
    checkVector(vector);
    if (!Number.isInteger(options.topK) || options.topK < 1)
      throw new TypeError(`topK must be a whole number from 1, got ${options.topK}`);
    const path = options.scope.path;
    const conditions = Object.entries(options.filter ?? {});
    const hits: VectorHit[] = [];
    for (const item of this.items.values()) {
      if (item.scope.path !== path && !item.scope.path.startsWith(`${path}.`)) continue;
      if (!conditions.every(([key, value]) => item.metadata[key] === value)) continue;
      hits.push({
        id: item.id,
        score: cosineOf(vector, item.vector),
        text: item.text,
        metadata: item.metadata,
      });
    }
    hits.sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    return hits.slice(0, options.topK);
  }

  /** Removes the items of `ids`; an unknown id is ignored. */
  async remove(ids: readonly string[]): Promise<void> {
    for (const id of ids) this.items.delete(id);
  }

  /** The stored metadata of each of `ids`, by id; an unknown id has no entry. */
  override async metadataOf(
    ids: readonly string[],
  ): Promise<ReadonlyMap<string, VectorItem["metadata"]>> {
    return new Map(
      ids.flatMap((id) => {
        const item = this.items.get(id);
        return item === undefined ? [] : [[id, item.metadata] as const];
      }),
    );
  }
}
