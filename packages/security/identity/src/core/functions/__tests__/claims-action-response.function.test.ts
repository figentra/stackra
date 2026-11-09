/**
 * Stackra file contract:
 * Purpose: unit tests of `claimsActionResponse`: it appends every `IDENTITY_CLAIMS` name (the scope path only once a
 *          scope is chosen), and what it appends reads back through `actorOf` and `sessionUserOf`, the realm included.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0206 (decisions 2 and 3); STA-2558.
 */
import { ActorKind, Realm } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { IDENTITY_CLAIMS } from "#core/constants/identity-claims.constant";
import { MemoryServicePrincipalsDriver } from "#core/drivers/memory-service-principals.driver";
import { actorOf } from "#core/functions/actor-of.function";
import { claimsActionResponse } from "#core/functions/claims-action-response.function";
import { sessionUserOf } from "#core/functions/session-user-of.function";
import type { StackraClaims } from "#core/types/stackra-claims.type";

const CLAIMS: StackraClaims = {
  userId: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
  realm: Realm.Staff,
  memberships: [
    {
      scopeId: "scp_01j9z3k4m5n6p7q8r9s0t1v2w4",
      path: "platform.acme",
      name: "Acme",
      roles: ["admin"],
    },
  ],
  scopePath: "platform.acme",
  permissions: ["orders.order.read"],
};

/** The token claims a provider would issue with `answer` appended. */
const tokenOf = (answer: ReturnType<typeof claimsActionResponse>) => ({
  sub: "312909075212468632",
  email: "dana@acme.example",
  ...Object.fromEntries(answer.append_claims.map((claim) => [claim.key, claim.value])),
});

describe("claimsActionResponse", () => {
  /** A token without the realm is refused once the auth handler reads it, so it is always appended. */
  it("appends every IDENTITY_CLAIMS name", () => {
    expect(
      claimsActionResponse(CLAIMS)
        .append_claims.map((claim) => claim.key)
        .toSorted(),
    ).toEqual(Object.values(IDENTITY_CLAIMS).toSorted());
  });

  /** Before a scope is chosen the token names none; the rest stay. */
  it("leaves the scope path out until a scope is chosen", () => {
    const { scopePath: _scopePath, ...unscoped } = CLAIMS;
    const keys = claimsActionResponse(unscoped).append_claims.map((claim) => claim.key);
    expect(keys).not.toContain(IDENTITY_CLAIMS.scopePath);
    expect(keys).toContain(IDENTITY_CLAIMS.realm);
  });

  /** What the action appends is what the readers of a token expect. */
  it("reads back through actorOf and sessionUserOf", async () => {
    const token = tokenOf(claimsActionResponse(CLAIMS));

    expect(await actorOf(token, new MemoryServicePrincipalsDriver())).toMatchObject({
      kind: ActorKind.User,
      id: CLAIMS.userId,
      realm: Realm.Staff,
    });
    expect(sessionUserOf(token)).toMatchObject({
      userId: CLAIMS.userId,
      permissions: ["orders.order.read"],
      memberships: [expect.objectContaining({ tenantId: "scp_01j9z3k4m5n6p7q8r9s0t1v2w4" })],
    });
  });
});
