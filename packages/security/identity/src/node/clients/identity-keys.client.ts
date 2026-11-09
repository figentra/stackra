/**
 * Stackra file contract:
 * Purpose: `IdentityKeysClient`, this package's client of the identity service for the gateway's key reads: `lookup` is
 *          the member that calls `principals.api_key.verify@1`.
 * Boundary: internal to `./node`; built by `ServiceApiKeyStoreDriver` over the injected `ClientTransport`, so topology
 *           picks the transport as for every generated client. The call is the hosting service's own (its service
 *           token), never the key's caller.
 * Runtime: node
 * Governing contract: ADR 0260 (decision 6); ADR 0278 (amendment of 2026-11-09); STA-2646.
 */
import { ServiceClient } from "@stackra/clients";
import type { QueryMember } from "@stackra/clients";

import { VERIFY_API_KEY_QUERY } from "#node/constants/verify-api-key-query.constant";

/**
 * The identity service, as a gateway reads keys from it.
 *
 * @example
 * const record = await new IdentityKeysClient(transport).lookup().call({ keyHash });
 */
export class IdentityKeysClient extends ServiceClient {
  /** The member that reads a key by its hash. */
  lookup(): QueryMember<typeof VERIFY_API_KEY_QUERY> {
    return this.member(VERIFY_API_KEY_QUERY);
  }
}
