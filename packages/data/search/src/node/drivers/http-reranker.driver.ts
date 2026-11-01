/**
 * Stackra file contract:
 * Purpose: `HttpRerankerDriver`, a `Reranker` that calls a text-embeddings-inference `/rerank` endpoint in the tenant's
 *          region (`search.reranker.url`): the self-hosted `tools-retrieval` image (`bge-reranker-v2-m3`), or a provider's
 *          in-region endpoint speaking the same contract, so the text being judged never leaves the region.
 * Boundary: posts `{ query, texts }` to `<url>/rerank` and reads `[{ index, score }]`, so a candidate is matched by its
 *           position, never by text. It returns the best `topN` best first, ties in the order given. The bearer token is read at call
 *           time from the runtime's `SecretStore` under the secret name `tokenSecret` (ADR 0173: the runtime binds the
 *           store, runway syncs the value); the value is never logged, kept or put in an error. An index the endpoint
 *           returns that is not a candidate, or a score that is not a finite number, is refused rather than ranked.
 * Runtime: node
 * Governing contract: ADR 0492 (decisions 4 and 8: the reranker and the `tools-retrieval` image); ADR 0354 (data stays
 *                     in the region); ADR 0173 (secrets from the runtime secret store); ADR 0294 (decisions 16 and 17).
 */
import type { SecretStore } from "@stackra/config/contracts";
import { Driver } from "@stackra/container";

import type { SearchConfig } from "#config/search.config";
import { Reranker } from "#contracts/ports/reranker.port";
import type { RerankCandidate } from "#contracts/types/rerank-candidate.type";
import type { RerankHit } from "#contracts/types/rerank-hit.type";

/** One item of the endpoint's answer. */
interface RerankReply {
  readonly index?: unknown;
  readonly score?: unknown;
}

/**
 * Reranks through the in-region endpoint.
 *
 * @example
 * // runway.yaml (ksa): config.search.reranker: { url: https://retrieval.sa.internal, tokenSecret: SEARCH_RERANKER_TOKEN, topN: 50 }
 */
export class HttpRerankerDriver extends Driver(Reranker) {
  /** The most candidates one call takes. */
  readonly topN: number;

  private readonly url: string;

  /** The name of the secret holding the bearer token; `null` for an endpoint that needs none. */
  private readonly tokenSecret: string | null;

  /** Where the token is read from at call time. */
  private readonly secrets: SecretStore;

  /**
   * @param config - the endpoint, token secret name and candidate window (`reranker`).
   * @param secrets - the runtime's secret store.
   * @throws TypeError when no endpoint is configured.
   */
  constructor(config: SearchConfig, secrets: SecretStore) {
    super();
    const { url, tokenSecret, topN } = config.reranker;
    if (url === null) throw new TypeError("The http reranker needs `search.reranker.url`");
    this.url = url.replace(/\/+$/, "");
    this.tokenSecret = tokenSecret;
    this.topN = topN;
    this.secrets = secrets;
  }

  /**
   * The best `topN` of `candidates` for `query`, best first.
   *
   * @throws RangeError when `topN` is not a whole number from 1, or the endpoint answers an unknown index or a bad score.
   * @throws Error when the endpoint answers with an error status, or a token secret is named but not bound.
   */
  async rerank(
    query: string,
    candidates: readonly RerankCandidate[],
    topN: number,
  ): Promise<readonly RerankHit[]> {
    if (!Number.isInteger(topN) || topN < 1)
      throw new RangeError(`topN must be a whole number from 1, got ${topN}`);
    if (candidates.length === 0) return [];
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (this.tokenSecret !== null) {
      const token = this.secrets.get(this.tokenSecret);
      if (token === undefined || token === "")
        throw new Error(`The reranker token secret ${this.tokenSecret} is not bound`);
      headers["authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(`${this.url}/rerank`, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, texts: candidates.map((candidate) => candidate.text) }),
    });
    if (!response.ok) throw new Error(`The reranker answered ${response.status}`);
    const reply = (await response.json()) as readonly RerankReply[];
    const hits = reply.map((item) => {
      const candidate =
        typeof item.index === "number" && Number.isInteger(item.index)
          ? candidates[item.index]
          : undefined;
      if (candidate === undefined || typeof item.score !== "number" || !Number.isFinite(item.score))
        throw new RangeError(
          "The reranker answered an unknown candidate or a score that is not a number",
        );
      return { id: candidate.id, score: item.score, at: Number(item.index) };
    });
    return (
      hits
        // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
        .sort((a, b) => b.score - a.score || a.at - b.at)
        .slice(0, topN)
        .map(({ id, score }) => ({ id, score }))
    );
  }
}
