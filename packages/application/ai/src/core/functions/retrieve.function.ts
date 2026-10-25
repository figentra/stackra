/**
 * Stackra file contract:
 * Purpose: `retrieve`, the retrieval helper for `Facts`: it embeds a query with the `Embedder`, asks the `VectorIndex`
 *          for the top-k hits in the caller's scope and returns them as passages (text, source id, score) that a
 *          `Facts` subclass returns from `provide`.
 * Boundary: one embed call and one index query, no state. It is not a tool source: tools are queries and actions
 *           that gen derives (ADR 0245 decision 3). The scope bounds the search and the index's row-level security
 *           bounds it again; the passages are model input, so a facts class still authorizes the record it is about.
 * Runtime: isomorphic
 * Governing contract: ADR 0245 (decisions 3 and 7); ADR 0160; ADR 0327 (decision 9); owner decision 23.
 */
import type { RetrieveOptions } from "#core/types/retrieve-options.type";
import type { RetrievedPassage } from "#core/types/retrieved-passage.type";

/**
 * The passages nearest to `query`, best first.
 *
 * @throws RangeError when the query is blank, or the embedder returns no vector for it.
 * @throws TypeError (from the index) when `topK` is not a whole number from 1.
 * @example
 * async provide(articleId: Article["id"], ctx: FactsContext): Promise<ContextFacts> {
 *   const passages = await retrieve(question, { index: this.index, embedder: this.embedder, topK: 4, scope });
 *   return { summary: `${passages.length} passages match.`, facts: { passages } };
 * }
 */
export async function retrieve(
  query: string,
  options: RetrieveOptions,
): Promise<readonly RetrievedPassage[]> {
  if (query.trim() === "") throw new RangeError("retrieve: the query is blank");
  const [vector] = await options.embedder.embed([query]);
  if (vector === undefined || vector.length === 0)
    throw new RangeError("retrieve: the embedder returned no vector for the query");
  const hits = await options.index.query(vector, { topK: options.topK, scope: options.scope });
  return hits.map((hit) => ({
    text: hit.text,
    source: typeof hit.metadata["source"] === "string" ? hit.metadata["source"] : hit.id,
    score: hit.score,
  }));
}
