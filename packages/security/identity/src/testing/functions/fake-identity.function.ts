/**
 * Stackra file contract:
 * Purpose: `fakeIdentity(principals)`, the `IdentityResolver` a service test binds in place of the platform's: the
 *          address and language of each principal the test names, every address verified.
 * Boundary: test code only; a `MemoryIdentityResolverDriver`, so lookups behave as the port requires (an unknown
 *           principal refuses `not_found`, addresses compare case-insensitively). Two calls never share state.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0266; ADR 0134 (personal data is resolved, not copied).
 */
import type { PublicId, VerifiedPrincipal } from "@stackra/contracts";

import { MemoryIdentityResolverDriver } from "#core/index";

/**
 * An identity resolver over `principals`.
 *
 * @example
 * createTestingModule(NotificationsModule)
 *   .override(IdentityResolver, fakeIdentity({ [customer.id]: { email: "a@acme.example", locale: "ar" } }))
 *   .compile();
 */
export function fakeIdentity(
  principals: Readonly<Record<PublicId<"usr">, Omit<VerifiedPrincipal, "id">>> = {},
): MemoryIdentityResolverDriver {
  return new MemoryIdentityResolverDriver(principals);
}
