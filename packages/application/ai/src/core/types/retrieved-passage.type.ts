/**
 * Stackra file contract:
 * Purpose: `RetrievedPassage`, one passage `retrieve` found for a query: its text, the id of the source it came from
 *          and how close it is. The shape a `Facts` subclass puts under `facts` (`{ passages }`) in what `provide`
 *          returns.
 * Boundary: a type only. It is model input, so it holds the passage text the principal's scope may read and ids,
 *           never a database id or a secret (ADR 0156 guardrails). `source` is the hit's `source` metadata when the
 *           indexer set one, else the passage id.
 * Runtime: isomorphic
 * Governing contract: ADR 0245 (decision 3: no hand-written tools; decision 7: facts); ADR 0160; owner decision 23.
 */

/** One retrieved passage. */
export interface RetrievedPassage {
  /** The passage's text. */
  readonly text: string;

  /** The id of the document or record the passage came from. */
  readonly source: string;

  /** The cosine similarity to the query, from -1 to 1; the higher the closer. */
  readonly score: number;
}
