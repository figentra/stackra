/**
 * Stackra file contract:
 * Purpose: `EdgeDeps`: what `handleRequest` needs — the settings, the signing secret, the issuer's key lookup, the
 *          fetch to the origin, the clock and the request-id source.
 * Boundary: types only; `main.ts` builds it from the environment, tests build it with stubs.
 * Runtime: worker
 * Governing contract: ADR 0437 (decisions 2 and 4); ADR 0206 (decision 8).
 */
import type { JsonWebKeys } from "@stackra/app/contracts";

import type { EdgeSettings } from "#src/interfaces/edge-settings.interface";

/** What `handleRequest` needs. */
export interface EdgeDeps {
  /** The parsed vars. */
  readonly settings: EdgeSettings;
  /** The newest edge signing secret. */
  readonly secret: string;
  /** The issuer's public key of a `kid`. */
  readonly keys: JsonWebKeys["find"];
  /** The fetch that reaches the origin. */
  readonly fetcher: typeof fetch;
  /** Now. */
  readonly now: () => Date;
  /** A new request id. */
  readonly requestId: () => string;
}
