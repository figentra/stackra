/**
 * Stackra file contract:
 * Purpose: `ServicePrincipal`, the principal a service's own ZITADEL service account (machine user) is: its `svc_`
 *          public id, the `<product>.<member>` key that seeds and lookups use, and the tenant it is bound to.
 * Boundary: a type in the leaf entry; the `ServicePrincipals` port answers it by the token's subject. The key is never
 *           part of the id (`svc_ship.shipping` fails the public-id decode).
 * Runtime: isomorphic
 * Governing contract: ADR 0209 (decision 3: service-to-service calls); ADR 0135 (public ids); STA-2558.
 */
import type { PublicId } from "@stackra/contracts";

/** One service principal. */
export interface ServicePrincipal {
  /** The principal's public id (`svc_` and 26 characters), what grants and the audit name. */
  readonly id: PublicId<"svc">;

  /** The calling service, `<product>.<member>` (`ship.shipping`). */
  readonly key: string;

  /** The tenant the principal is bound to; absent for a platform principal. */
  readonly scopeId?: PublicId;
}
