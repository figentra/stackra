/**
 * Stackra file contract:
 * Purpose: `tenantActor(tenantId?)`, a tenant staff user acting in one tenant, the actor `withTenant` and an action
 *          test take.
 * Boundary: test helper; a fresh tenant id when none is given, and a fixed fake user id. Never a credential.
 * Runtime: isomorphic
 * Governing contract: ADR 0098 (the actor); ADR 0269 (testing entries); OS audit SPEC gap 11.
 */
import { ActorKind, Realm, type Actor, type PublicId } from "@stackra/contracts";

import { fakeTenantId } from "#testing/functions/fake-tenant-id.function";

/**
 * A user of `tenantId` in the tenant realm.
 *
 * @example
 * await tenancy.withTenant(tenantActor(tenantId), () => orders.insert(draft));
 */
export function tenantActor(tenantId: PublicId<"scp"> = fakeTenantId()): Actor {
  return {
    kind: ActorKind.User,
    id: "usr_00000000000000000000000000",
    realm: Realm.Tenant,
    tenantId,
  };
}
