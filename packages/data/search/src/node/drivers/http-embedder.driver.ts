/**
 * Stackra file contract:
 * Purpose: `HttpEmbedderDriver`, an `Embedder` that calls an OpenAI-compatible embeddings endpoint in the tenant's
 *          region (`search.embedder.url`): a self-hosted multilingual model, or a provider's in-region endpoint, so the
 *          text being embedded never leaves the region.
 * Boundary: posts `{ model, input }` to `<url>/embeddings` and returns the vectors in input order (by each item's
 *           `index`). It checks every vector has `search.embedder.dimensions` numbers, so a model swapped under the
 *           index is refused rather than mixed in. The bearer token is read at call time from the environment variable
 *           `tokenEnv` names; the value is never logged or kept. Which provider and region is runway's value.
 * Runtime: node
 * Governing contract: ADR 0221 (decision 1: pgvector lane); ADR 0354 (data stays in the region); ADR 0173 (secrets
 *                     from the runtime); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";

import { SearchConfig } from "#config/search.config";
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
 * // runway.yaml (ksa): config.search.embedder: { url: https://embed.sa.internal/v1, model: multilingual-e5-large, dimensions: 1024 }
 */
export class HttpEmbedderDriver extends Driver(Embedder) {
  /** The vector size of the model. */
  readonly dimensions: number;

  private readonly url: string;

  private readonly model: string;

  private readonly tokenEnv: string | null;

  /**
   * @param config - the endpoint, model, vector size and token variable (`embedder`).
   * @throws TypeError when no endpoint or model is configured.
   */
  constructor(config: SearchConfig) {
    super();
    const { url, model, dimensions, tokenEnv } = config.embedder;
    if (url === null || model === "")
      throw new TypeError(
        "The http embedder needs `search.embedder.url` and `search.embedder.model`",
      );
    this.url = url.replace(/\/+$/, "");
    this.model = model;
    this.dimensions = dimensions;
    this.tokenEnv = tokenEnv;
  }

  /**
   * One vector per text, in the order given.
   *
   * @throws Error when the endpoint answers with an error status or a token variable is named but unset.
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
    if (this.tokenEnv !== null) {
      const token = process.env[this.tokenEnv];
      if (token === undefined || token === "")
        throw new Error(`The embedder token variable ${this.tokenEnv} is not set`);
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
