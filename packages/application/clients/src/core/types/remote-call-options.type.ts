/**
 * Stackra file contract:
 * Purpose: `RemoteCallOptions<I, O>`, the second argument of `remoteAction` and `remoteQuery` in a service's generated
 *          client: the input and output schemas and the route.
 * Boundary: a type only; the service form of the action and query ref options.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decisions 3 and 6).
 */
import type { EndpointOptions } from "@stackra/actions";

import type { RefSchema } from "#core/types/ref-schema.type";

/** What a service-side action or query descriptor declares. */
export interface RemoteCallOptions<I extends RefSchema, O extends RefSchema> {
  /** The input schema. */
  readonly input: I;

  /** The output schema. */
  readonly output: O;

  /** The route, used when the topology sends the call over the network. */
  readonly endpoint?: EndpointOptions;
}
