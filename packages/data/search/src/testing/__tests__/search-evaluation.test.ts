/**
 * Stackra file contract:
 * Purpose: unit tests of the evaluation set and its metrics: `ndcgAt` is 1 for the ideal order and falls as relevant ids
 *          sink, `recallAt` counts the relevant ids found in the first k, and every label of
 *          `SEARCH_EVALUATION_QUERIES` names a product of `SEARCH_EVALUATION_CATALOGUE` and every synonym line reads.
 * Boundary: test only; no engine runs. The thresholds are asserted against a live engine by `search-evaluation.int.test.ts`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0492 (decision 5 and enforcement).
 */
import { describe, expect, it } from "@stackra/testing";

import { SEARCH_SYNONYM_LINE } from "#core/constants/search-synonym-line.constant";
import { ndcgAt } from "#testing/ndcg-at.function";
import { recallAt } from "#testing/recall-at.function";
import { SEARCH_EVALUATION_CATALOGUE } from "#testing/search-evaluation-catalogue.constant";
import { SEARCH_EVALUATION_QUERIES } from "#testing/search-evaluation-queries.constant";
import { SEARCH_EVALUATION_SYNONYMS } from "#testing/search-evaluation-synonyms.constant";
import { SEARCH_EVALUATION_THRESHOLDS } from "#testing/search-evaluation-thresholds.constant";

describe(ndcgAt, () => {
  const grades = { a: 2, b: 1 };

  it("is 1 for the ideal order, and lower when a relevant id sinks", () => {
    expect(ndcgAt(["a", "b"], grades, 10)).toBeCloseTo(1);
    expect(ndcgAt(["x", "a", "b"], grades, 10)).toBeLessThan(ndcgAt(["a", "x", "b"], grades, 10));
    expect(ndcgAt(["b", "a"], grades, 10)).toBeLessThan(1);
  });

  it("cuts at k, scores 0 for nothing found or nothing relevant, and refuses a bad k", () => {
    expect(ndcgAt(["x", "a"], grades, 1)).toBe(0);
    expect(ndcgAt(["a"], {}, 10)).toBe(0);
    expect(() => ndcgAt(["a"], grades, 0)).toThrow(RangeError);
  });
});

describe(recallAt, () => {
  it("is the share of relevant ids in the first k", () => {
    expect(recallAt(["a", "x"], { a: 2, b: 1 }, 50)).toBe(0.5);
    expect(recallAt(["x", "a", "b"], { a: 2, b: 1 }, 2)).toBe(0.5);
    expect(recallAt(["b"], { a: 0, b: 1 }, 5)).toBe(1);
  });

  it("is 1 when nothing is relevant, and refuses a bad k", () => {
    expect(recallAt([], {}, 5)).toBe(1);
    expect(() => recallAt([], {}, 1.5)).toThrow(RangeError);
  });
});

describe("the evaluation set", () => {
  it("labels only products of the catalogue, with Arabic, English and mixed queries", () => {
    const ids = new Set(SEARCH_EVALUATION_CATALOGUE.map((product) => product.id));
    expect(ids.size).toBe(SEARCH_EVALUATION_CATALOGUE.length);
    for (const judged of SEARCH_EVALUATION_QUERIES)
      for (const id of Object.keys(judged.grades)) expect(ids.has(id)).toBe(true);
    expect(new Set(SEARCH_EVALUATION_QUERIES.map((judged) => judged.script))).toEqual(
      new Set(["english", "arabic", "mixed"]),
    );
  });

  it("has synonym lines the setting's grammar reads, and thresholds between 0 and 1", () => {
    for (const line of SEARCH_EVALUATION_SYNONYMS.split("\n"))
      expect(SEARCH_SYNONYM_LINE.test(line)).toBe(true);
    for (const threshold of Object.values(SEARCH_EVALUATION_THRESHOLDS)) {
      expect(threshold).toBeGreaterThan(0);
      expect(threshold).toBeLessThanOrEqual(1);
    }
  });
});
