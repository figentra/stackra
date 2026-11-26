/**
 * Stackra file contract:
 * Purpose: the `IdpOrganizations` port: the identity provider organisation a scope's people sign in through (the
 *          tenant's own organisation), so an administrator's login policy call reaches exactly that organisation.
 * Boundary: an abstract class that is its own token. The mapping is the host's (the identity service keeps which
 *           organisation it created for which tenant); this package never guesses it from a name or a body field. It
 *           is given the call's scope, which the session settled, and answers `undefined` for a scope with no
 *           organisation (a platform call, a tenant not provisioned yet). The memory driver serves tests.
 * Runtime: isomorphic
 * Governing contract: ADR 0206; ADR 0207 (decision 1: the MFA policy); ADR 0410 (decision 4); ADR 0323 (no tenant
 *                     identifier here); STA-2817.
 */
import { Port } from "@stackra/contracts";
import type { ScopeRef } from "@stackra/contracts";

/**
 * Finds a scope's identity provider organisation.
 *
 * @example
 * const organizationId = await organizations.organizationOf(ctx.scope);
 */
export abstract class IdpOrganizations extends Port {
  /**
   * The provider-side id of the organisation the people of `scope` sign in through, or `undefined` when it has none.
   *
   * @throws IdpAdminUnavailableError when the mapping's store cannot be reached.
   */
  abstract organizationOf(scope: ScopeRef): Promise<string | undefined>;
}
