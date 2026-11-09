/**
 * Stackra file contract:
 * Purpose: `EdgeConfig`, the edge signature's configuration (key `app.edge`): the drivers of `EdgeSigningKeys` and
 *          `EdgeNonceStore`, and the signing keys the `env` driver reads.
 * Boundary: a configuration class over `EdgeOptions`; the secret is read by `@Secret`, never a value here. The first
 *           layer of package → host → environment → runway.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0437 (decision 4).
 */
import { Config } from "@stackra/config";

import { EdgeOptions } from "#core/schemas/edge-options.schema";

/**
 * The edge configuration.
 *
 * @example
 * import { EdgeConfig as BaseEdgeConfig } from "@stackra/app/server";
 *
 * export class EdgeConfig extends BaseEdgeConfig {
 *   override keys = "env" as const;
 * }
 */
export class EdgeConfig extends Config({ schema: EdgeOptions }) {}
