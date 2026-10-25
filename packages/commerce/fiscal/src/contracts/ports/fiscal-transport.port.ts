/**
 * Stackra file contract:
 * Purpose: `FiscalTransport`, the port drivers send authority, ASP and access-point calls through.
 * Boundary: an abstract class that is its own token, key `fiscal.FiscalTransport`. The host binds it over its HTTP
 *           client and attaches the named unit's credential (mutual TLS, a basic token, an API key), so no secret
 *           reaches a driver. It throws on a network failure and returns every HTTP status. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 4); ADR 0173 (secrets stay with the host).
 */
import { Port } from "@stackra/contracts";

import type { TransportRequest } from "#contracts/types/transport-request.type";
import type { TransportResponse } from "#contracts/types/transport-response.type";

/**
 * Sends one request.
 *
 * @example
 * const response = await transport.send({ method: "POST", url, credential: unitId, headers, body });
 */
export abstract class FiscalTransport extends Port {
  /** Type-only port key. */
  declare readonly "~key": "fiscal.FiscalTransport";

  /** The response of any status; throws when nothing came back. */
  abstract send(request: TransportRequest): Promise<TransportResponse>;
}
