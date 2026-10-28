/**
 * Stackra file contract:
 * Purpose: `passageIdOf`, the vector-index id of a semantic model row's passage, `<Model>:<primary key>` for its first
 *          passage and `<Model>:<primary key>#<n>` for the n-th of a chunked row (`passageIdsOf` lists them all). One
 *          place for the ids `SemanticChangeService` stores under and `SearchForgetService` removes by.
 * Boundary: pure; unique across the shared vector table because the model's class name prefixes it. A row holds at
 *           most `MAX_SEMANTIC_CHUNKS` passages.
 * Runtime: node
 * Governing contract: ADR 0160 (pgvector); ADR 0221 (decision 7: erasure); stackra-301 (chunks).
 */
import type { AnyClass } from "@stackra/container";

/**
 * The id of passage `chunk` (0 when absent) of row `id` of `model`.
 *
 * @example
 * passageIdOf(CaseNote, "cnt_1"); // "CaseNote:cnt_1"
 * passageIdOf(CaseNote, "cnt_1", 2); // "CaseNote:cnt_1#2"
 */
export function passageIdOf(model: AnyClass, id: string, chunk = 0): string {
  return chunk === 0 ? `${model.name}:${id}` : `${model.name}:${id}#${chunk}`;
}
