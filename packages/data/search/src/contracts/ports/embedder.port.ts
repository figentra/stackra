/**
 * Stackra file contract:
 * Purpose: the `Embedder` port: turns texts into embedding vectors for a `VectorIndex`.
 * Boundary: an abstract class that is its own token. Its provider drivers live with the AI integrations;
 *           `HttpEmbedderDriver` (`./node`) calls any OpenAI-compatible endpoint in the tenant's region. Every vector one embedder returns has `dimensions` numbers, and
 *           an index holds the vectors of one embedder only. A leaf file: it imports nothing but the `Port` base.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (model providers); ADR 0294 (decisions 15 and 16); owner decision 23.
 */
import { Port } from "@stackra/contracts";

/**
 * Makes embeddings.
 *
 * @example
 * const [vector] = await embedder.embed(["linen shirt"]);
 */
export abstract class Embedder extends Port {
  /** How many numbers each vector holds. */
  abstract readonly dimensions: number;

  /** One vector per text, in the order given. */
  abstract embed(texts: readonly string[]): Promise<number[][]>;
}
