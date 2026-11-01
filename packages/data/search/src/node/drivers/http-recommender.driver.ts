/**
 * Stackra file contract:
 * Purpose: `HttpRecommenderDriver`, a `Recommender` that calls the `tools-recommend` image (implicit ALS over a tenant's
 *          interactions) in the tenant's region (`search.recommender.url`), which replaces the Postgres answers for a
 *          tenant whose interactions passed the threshold in settings.
 * Boundary: posts `{ tenant, item, kind, limit }` to `<url>/recommend` (`kind` is `similar` or `bought_together`) and
 *           reads `[{ id, score }]`, best first, the item itself dropped. `tenant` is the call's own scope node id (`options.scope`,
 *           the session's, never input) and required, since the image keeps one model per tenant. The bearer token is read
 *           at call time from the runtime's `SecretStore` under the secret name `tokenSecret` (ADR 0173); the value is
 *           never logged, kept or put in an error.
 * Runtime: node
 * Governing contract: ADR 0492 (decision 8: the `tools-recommend` image behind the `Recommender` port); ADR 0354; ADR 0173;
 *                     ADR 0294 (decisions 16 and 17).
 */
import type { SecretStore } from "@stackra/config/contracts";
import { Driver } from "@stackra/container";

import type { SearchConfig } from "#config/search.config";
import { Recommender } from "#contracts/ports/recommender.port";
import type { RecommendOptions } from "#contracts/types/recommend-options.type";
import type { Recommendation } from "#contracts/types/recommendation.type";

/** The two answers the image gives, as it names them. */
type Kind = "similar" | "bought_together";

/** One item of the image's answer. */
interface RecommendReply {
  readonly id?: unknown;
  readonly score?: unknown;
}

/**
 * Recommends through the image.
 *
 * @example
 * // runway.yaml: config.search.recommender: { url: https://recommend.sa.internal, tokenSecret: SEARCH_RECOMMENDER_TOKEN }
 */
export class HttpRecommenderDriver extends Driver(Recommender) {
  private readonly url: string;

  /** The name of the secret holding the bearer token; `null` for an endpoint that needs none. */
  private readonly tokenSecret: string | null;

  /** How many items one answer holds when the call names no limit. */
  private readonly limit: number;

  /** Where the token is read from at call time. */
  private readonly secrets: SecretStore;

  /**
   * @param config - the endpoint, token secret name and default limit (`recommender`).
   * @param secrets - the runtime's secret store.
   * @throws TypeError when no endpoint is configured.
   */
  constructor(config: SearchConfig, secrets: SecretStore) {
    super();
    const { url, tokenSecret, limit } = config.recommender;
    if (url === null) throw new TypeError("The http recommender needs `search.recommender.url`");
    this.url = url.replace(/\/+$/, "");
    this.tokenSecret = tokenSecret;
    this.limit = limit;
    this.secrets = secrets;
  }

  /** The items closest to `itemId`. */
  similar(itemId: string, options: RecommendOptions = {}): Promise<readonly Recommendation[]> {
    return this.ask("similar", itemId, options);
  }

  /** The items bought together with `itemId`. */
  boughtTogether(
    itemId: string,
    options: RecommendOptions = {},
  ): Promise<readonly Recommendation[]> {
    return this.ask("bought_together", itemId, options);
  }

  /**
   * One call to the image.
   *
   * @throws RangeError for a limit that is not a whole number from 1, or an answer that is not `{ id, score }` items.
   * @throws TypeError when the call names no scope.
   * @throws Error when the image answers with an error status, or a token secret is named but not bound.
   */
  private async ask(
    kind: Kind,
    item: string,
    options: RecommendOptions,
  ): Promise<readonly Recommendation[]> {
    const limit = options.limit ?? this.limit;
    if (!Number.isInteger(limit) || limit < 1)
      throw new RangeError(`A recommendation limit is a whole number from 1, got ${limit}`);
    if (options.scope === undefined)
      throw new TypeError("The http recommender answers for a scope: pass `options.scope`");
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (this.tokenSecret !== null) {
      const token = this.secrets.get(this.tokenSecret);
      if (token === undefined || token === "")
        throw new Error(`The recommender token secret ${this.tokenSecret} is not bound`);
      headers["authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(`${this.url}/recommend`, {
      method: "POST",
      headers,
      body: JSON.stringify({ tenant: options.scope.id, item, kind, limit }),
    });
    if (!response.ok) throw new Error(`The recommender answered ${response.status}`);
    const reply = (await response.json()) as readonly RecommendReply[];
    return reply
      .map((entry) => {
        if (
          typeof entry.id !== "string" ||
          typeof entry.score !== "number" ||
          !Number.isFinite(entry.score)
        )
          throw new RangeError("The recommender answered an item that is not { id, score }");
        return { id: entry.id, score: entry.score };
      })
      .filter((entry) => entry.id !== item)
      .slice(0, limit);
  }
}
