/**
 * Stackra file contract:
 * Purpose: `runRerankerConformance(makeReranker)`, the `Reranker` conformance suite: checks a driver returns each given
 *          candidate at most once, best score first, never an unknown id, at most `topN` of them, and refuses a bad
 *          `topN`; and returns each rule it missed.
 * Boundary: a test helper in the `./testing` entry, free of any test framework and importing `./contracts` only, so the
 *           memory driver, `HttpRerankerDriver` (over a replaced `fetch`) and a Pro engine assert `mismatches` empty with
 *           their own runner. It checks the contract, never relevance: no ranking quality is asserted.
 * Runtime: isomorphic
 * Governing contract: ADR 0089 (decision 5: every driver passes its port's conformance suite); ADR 0492 (decision 4);
 *                     ADR 0266; ADR 0269.
 */
import type { Reranker, RerankCandidate } from "#contracts/index";

/** The candidates every case reranks. */
const CANDIDATES: readonly RerankCandidate[] = [
  { id: "a", text: "linen shirt" },
  { id: "b", text: "wool coat" },
  { id: "c", text: "linen trousers" },
];

/**
 * Runs the suite and returns the missed rules.
 *
 * @example
 * const mismatches = await runRerankerConformance(() => new MemoryRerankerDriver());
 * expect(mismatches).toEqual([]);
 */
export async function runRerankerConformance(
  makeReranker: () => Reranker | Promise<Reranker>,
): Promise<string[]> {
  const mismatches: string[] = [];
  const reranker = await makeReranker();
  const hits = await reranker.rerank("linen shirt", CANDIDATES, CANDIDATES.length);
  const ids = hits.map((hit) => hit.id);
  if (new Set(ids).size !== ids.length) mismatches.push("returned a candidate twice");
  if (!ids.every((id) => CANDIDATES.some((candidate) => candidate.id === id)))
    mismatches.push("returned an id it was not given");
  if (hits.some((hit, at) => at > 0 && hit.score > (hits[at - 1]?.score ?? Infinity)))
    mismatches.push("did not return the best score first");
  if (hits.some((hit) => !Number.isFinite(hit.score)))
    mismatches.push("returned a score that is not finite");
  if ((await reranker.rerank("linen shirt", CANDIDATES, 2)).length > 2)
    mismatches.push("returned more than topN");
  if ((await reranker.rerank("linen shirt", [], 2)).length !== 0)
    mismatches.push("returned hits for no candidates");
  try {
    await reranker.rerank("linen shirt", CANDIDATES, 0);
    mismatches.push("accepted a topN of 0");
  } catch (error) {
    if (!(error instanceof RangeError))
      mismatches.push("refused a topN of 0 with a non-RangeError");
  }
  return mismatches;
}
