/**
 * Stackra file contract:
 * Purpose: the `ServicePrincipals` port: the service principal a verified token's subject is, so an inbound
 *          service-to-service call acts as the calling service (ADR 0209 decision 3).
 * Boundary: an abstract class that is its own token, keyed `identity.ServicePrincipals`. The identity service
 *           implements it over the principals the OS seeds (one per service, with its ZITADEL service account's user
 *           id); `MemoryServicePrincipalsDriver` serves tests. A read only: provisioning is the OS's.
 * Runtime: isomorphic
 * Governing contract: ADR 0209 (decision 3); ADR 0098 (decisions 6 and 7: the actor model); STA-2558.
 */
import { Port } from "@stackra/contracts";

import type { ServicePrincipal } from "#contracts/types/service-principal.type";

/**
 * Finds service principals by token subject.
 *
 * @example
 * const principal = await servicePrincipals.bySubject(String(claims.sub));
 * if (principal === undefined) throw UnauthenticatedError.create();
 */
export abstract class ServicePrincipals extends Port {
  /** Type-only port key, so `DriverName<ServicePrincipals>` narrows to this port's drivers. */
  declare readonly "~key": "identity.ServicePrincipals";

  /**
   * The principal whose service account is `subject` (the token's `sub`), or `undefined` for any other subject.
   *
   * @throws Error when the store cannot be reached; the call then fails, never passes.
   */
  abstract bySubject(subject: string): Promise<ServicePrincipal | undefined>;
}
