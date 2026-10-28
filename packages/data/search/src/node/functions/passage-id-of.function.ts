/**
 * Stackra file contract:
 * Purpose: `passageIdOf`, the vector-index id of a semantic model row's passage, `<Model>:<primary key>`: one place
 *          for the id `SemanticChangeService` stores under and `SearchForgetService` removes by.
 * Boundary: pure; unique across the shared vector table because the model's class name prefixes it.
 * Runtime: node
 * Governing contract: ADR 0160 (pgvector); ADR 0221 (decision 7: erasure).
 */
import type { AnyClass } from "@stackra/container";

/**
 * The passage id of row `id` of `model`.
 *
 * @example
 * passageIdOf(CaseNote, "cnt_1"); // "CaseNote:cnt_1"
 */
export function passageIdOf(model: AnyClass, id: string): string {
  return `${model.name}:${id}`;
}
