/**
 * Stackra file contract:
 * Purpose: unit test of `passageIdsOf`: every chunk slot of a row, from the first or from a given one, none past the
 *          cap.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; stackra-301.
 */
import { describe, expect, it } from "@stackra/testing";

import { MAX_SEMANTIC_CHUNKS } from "#core/constants/max-semantic-chunks.constant";
import { passageIdsOf } from "#node/functions/passage-ids-of.function";

class CaseNote {}

describe(passageIdsOf, () => {
  it("lists every chunk slot of a row, from the first or from a given one", () => {
    const ids = passageIdsOf(CaseNote, "cnt_1");
    expect(ids).toHaveLength(MAX_SEMANTIC_CHUNKS);
    expect(ids[0]).toBe("CaseNote:cnt_1");
    expect(ids[1]).toBe("CaseNote:cnt_1#1");
    expect(passageIdsOf(CaseNote, "cnt_1", MAX_SEMANTIC_CHUNKS - 1)).toEqual([
      `CaseNote:cnt_1#${MAX_SEMANTIC_CHUNKS - 1}`,
    ]);
    expect(passageIdsOf(CaseNote, "cnt_1", MAX_SEMANTIC_CHUNKS)).toEqual([]);
  });
});
