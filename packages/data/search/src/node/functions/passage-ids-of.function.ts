/**
 * Stackra file contract:
 * Purpose: `passageIdsOf`, every vector-index id a semantic model row may hold (`passageIdOf` for chunk 0 up to
 *          `MAX_SEMANTIC_CHUNKS`), so a removal reaches every chunk and a re-embed drops the ones past a shorter row's last.
 * Boundary: pure; a fixed, known set per row, because the chunker never cuts past `MAX_SEMANTIC_CHUNKS`.
 * Runtime: node
 * Governing contract: ADR 0221 (decision 7: erasure); stackra-301 (chunks).
 */
import type { AnyClass } from "@stackra/container";

import { MAX_SEMANTIC_CHUNKS } from "#core/constants/max-semantic-chunks.constant";
import { passageIdOf } from "#node/functions/passage-id-of.function";

/**
 * Every passage id row `id` of `model` may hold, from chunk `from` (0 when absent).
 *
 * @example
 * passageIdsOf(CaseNote, "cnt_1").length; // MAX_SEMANTIC_CHUNKS
 * passageIdsOf(CaseNote, "cnt_1", 2)[0]; // "CaseNote:cnt_1#2"
 */
export function passageIdsOf(model: AnyClass, id: string, from = 0): readonly string[] {
  return Array.from({ length: Math.max(MAX_SEMANTIC_CHUNKS - from, 0) }, (_, at) =>
    passageIdOf(model, id, from + at),
  );
}
