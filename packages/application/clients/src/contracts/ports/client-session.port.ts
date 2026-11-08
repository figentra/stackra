/**
 * Stackra file contract:
 * Purpose: the `ClientSession` port: what the client runtime needs from the caller's session, the headers every call
 *          carries (the credential, the active scope) and whether the session holds a permission. A transport hands
 *          `headers` the call it is about to send, so a service's session can pick the token for that call's producer.
 * Boundary: an abstract class that is its own token, keyed `clients.ClientSession`. The identity package implements it
 *           (the mobile wiring lists `clients` as depending on `identity`); this package never reads a token store, a
 *           cookie or a claim itself, and never names a header the session owns. `can` decides presentation only (a
 *           hidden button); the producer's pipeline still checks every call.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 3); ADR 0206 (identity is provider-neutral); ADR 0294 (decisions 15 and 16);
 *                     R-59 (scope, not tenant).
 */
import { Port } from "@stackra/contracts";

import type { ClientRequest } from "#contracts/types/client-request.type";

/**
 * The caller's session, as calls need it.
 *
 * @example
 * export class SessionClientSessionDriver extends Driver(ClientSession) {
 *   async headers() {
 *     return { Authorization: `Bearer ${await this.tokens.current()}` };
 *   }
 *   can(permission: string) {
 *     return this.session.permissions.includes(permission);
 *   }
 * }
 */
export abstract class ClientSession extends Port {
  /** Type-only port key, so `DriverName<ClientSession>` narrows to this port's drivers. */
  declare readonly "~key": "clients.ClientSession";

  /**
   * The headers of `request`, the next call; asked once per request, so a refreshed credential is used at once. A
   * browser or app session ignores `request`; a service's session reads its producer.
   */
  abstract headers(request?: ClientRequest): Promise<Readonly<Record<string, string>>>;

  /** Whether the session holds `permission` (`orders.order.cancel`). */
  abstract can(permission: string): boolean;
}
