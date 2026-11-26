/**
 * Stackra file contract:
 * Purpose: the `IdpOrganizations` port: the identity provider organisation a scope's people sign in through (the
 *          tenant's own organisation), so an administrator's login policy call reaches exactly that organisation.
 * Boundary: an abstract class that is its own token. The mapping is the host's (the identity service keeps which
 *           organisation it created for which tenant); this package never guesses it from a name or a body field. It
 *           is given the call's scope, which the session settled, and answers only for the exact node the organisation
 *           belongs to (the tenant's root node): `undefined` for any descendant (a branch's people sign in through the
 *           tenant's organisation, but a grant held at the branch must never change the whole tenant's policy, ADR
 *           0294 / 0462), and for a scope with no organisation (a platform call, a tenant not provisioned yet). The
 *           answer names that node (`IdpOrganization.scopeId`), and the callers refuse unless it is the call's own
 *           scope, so a host lookup that walks up the path cannot widen a grant. The memory driver serves tests.
 * Runtime: isomorphic
 * Governing contract: ADR 0206; ADR 0207 (decision 1: the MFA policy); ADR 0410 (decision 4); ADR 0323 (no tenant
 *                     identifier here); ADR 0294 and ADR 0462 (a grant reaches its subtree only); STA-2817.
 */
import { Port } from "@stackra/contracts";
import type { ScopeRef } from "@stackra/contracts";

import type { IdpOrganization } from "#contracts/types/idp-organization.type";

/**
 * Finds a scope's identity provider organisation.
 *
 * @example
 * const organization = await organizations.organizationOf(ctx.scope);
 * if (organization?.scopeId !== ctx.scope.id) throw NotFoundError.create();
 */
export abstract class IdpOrganizations extends Port {
  /**
   * The organisation linked to exactly the node `scope` names, with that node's id, or `undefined` when the node has
   * none of its own: a descendant of the node an organisation belongs to answers `undefined`, never its ancestor's.
   *
   * @throws IdpAdminUnavailableError when the mapping's store cannot be reached.
   */
  abstract organizationOf(scope: ScopeRef): Promise<IdpOrganization | undefined>;
}
