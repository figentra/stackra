/**
 * Stackra file contract:
 * Purpose: `HttpEmbedderDriver`, an `Embedder` that calls an OpenAI-compatible embeddings endpoint in the tenant's
 *          region (`search.embedder.url`): a self-hosted multilingual model, or a provider's in-region endpoint, so the
 *          text being embedded never leaves the region.
 * Boundary: posts `{ model, input }` to `<url>/embeddings` and returns the vectors in input order (by each item's
 *           `index`). It checks every vector has `search.embedder.dimensions` numbers, so a model swapped under the
 *           index is refused rather than mixed in. The bearer token is read at call time from the runtime's `SecretStore`
 *           under the secret name `tokenSecret` (ADR 0173: the runtime binds the store, runway syncs the value); the
 *           value is never logged, kept or put in an error. Which provider and region is runway's value.
 * Runtime: node
 * Governing contract: ADR 0221 (decision 1: pgvector lane); ADR 0354 (data stays in the region); ADR 0173 (secrets
 *                     from the runtime secret store); ADR 0294 (decisions 16 and 17); ADR 0404.
 */
import type { SecretStore } from "@stackra/config/contracts";
import { Driver } from "@stackra/container";

import type { SearchConfig } from "#config/search.config";
import { Embedder } from "#contracts/ports/embedder.port";

/** The texts sent in one request. */
const BATCH = 96;

/** The answer of an OpenAI-compatible embeddings endpoint. */
interface EmbeddingsReply {
  readonly data?: readonly { readonly index: number; readonly embedding: readonly number[] }[];
}

/**
 * Embeds texts through the in-region endpoint.
 *
 * @example
 * // runway.yaml (ksa): config.search.embedder: { url: https://embed.sa.internal/v1, model: multilingual-e5-large,
 * //   dimensions: 1024, tokenSecret: SEARCH_EMBEDDER_TOKEN }
 */
export class HttpEmbedderDriver extends Driver(Embedder) {
  /** The vector size of the model. */
  readonly dimensions: number;

  private readonly url: string;

  private readonly model: string;

  /** The name of the secret holding the bearer token; `null` for an endpoint that needs none. */
  private readonly tokenSecret: string | null;

  /** Where the token is read from at call time. */
  private readonly secrets: SecretStore;

  /**
   * @param config - the endpoint, model, vector size and token secret name (`embedder`).
   * @param secrets - the runtime's secret store.
   * @throws TypeError when no endpoint or model is configured.
   */
  constructor(config: SearchConfig, secrets: SecretStore) {
    super();
    const { url, model, dimensions, tokenSecret } = config.embedder;
    if (url === null || model === "")
      throw new TypeError(
        "The http embedder needs `search.embedder.url` and `search.embedder.model`",
      );
    this.url = url.replace(/\/+$/, "");
    this.model = model;
    this.dimensions = dimensions;
    this.tokenSecret = tokenSecret;
    this.secrets = secrets;
  }

  /**
   * One vector per text, in the order given.
   *
   * @throws Error when the endpoint answers with an error status, or a token secret is named but not bound.
   * @throws RangeError when a vector does not have the configured size, or one is missing.
   */
  async embed(texts: readonly string[]): Promise<number[][]> {
    const vectors: number[][] = [];
    for (let start = 0; start < texts.length; start += BATCH)
      vectors.push(...(await this.request(texts.slice(start, start + BATCH))));
    return vectors;
  }

  /** The vectors of one batch. */
  private async request(input: readonly string[]): Promise<number[][]> {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (this.tokenSecret !== null) {
      const token = this.secrets.get(this.tokenSecret);
      if (token === undefined || token === "")
        throw new Error(`The embedder token secret ${this.tokenSecret} is not bound`);
      headers["authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(`${this.url}/embeddings`, {
      method: "POST",
      headers,
      body: JSON.stringify({ model: this.model, input }),
    });
    if (!response.ok) throw new Error(`The embedder answered ${response.status}`);
    const reply = (await response.json()) as EmbeddingsReply;
    const byIndex = new Map((reply.data ?? []).map((item) => [item.index, item.embedding]));
    return input.map((_, index) => {
      const vector = byIndex.get(index);
      if (vector?.length !== this.dimensions)
        throw new RangeError(
          `The embedder returned ${vector?.length ?? "no"} numbers for text ${index}, not ${this.dimensions}`,
        );
      return [...vector];
    });
  }
}
