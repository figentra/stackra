/**
 * Stackra file contract:
 * Purpose: unit tests of `sessionUserOf`: the Stackra claims map to a `SessionUser` whose memberships are the tenancy
 *          package's shape (the `scp_` id, the path, the first role and every role), the name falls back to the
 *          address, and a token without the user id, the address or a role is refused `unauthenticated`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0206 (decision 2); ADR 0327 (decision 3).
 */
import { UnauthenticatedError } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { IDENTITY_CLAIMS } from "#core/constants/identity-claims.constant";
import { sessionUserOf } from "#core/functions/session-user-of.function";

/** The claims of a Stackra ID token. */
const CLAIMS = {
  sub: "312909075212468632",
  email: "rana@acme.example",
  name: "Rana",
  picture: "https://cdn.acme.example/rana.png",
  [IDENTITY_CLAIMS.userId]: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
  [IDENTITY_CLAIMS.permissions]: ["orders.order.read"],
  [IDENTITY_CLAIMS.memberships]: [
    {
      scopeId: "scp_01j9z3k4m5n6p7q8r9s0t1v2w4",
      path: "platform.acme",
      name: "Acme",
      roles: ["admin", "staff"],
    },
  ],
};

describe("sessionUserOf", () => {
  it("maps the claims to the provider-neutral user", () => {
    expect(sessionUserOf(CLAIMS)).toEqual({
      userId: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
      email: "rana@acme.example",
      displayName: "Rana",
      avatarUrl: "https://cdn.acme.example/rana.png",
      permissions: ["orders.order.read"],
      tenants: [
        {
          tenantId: "scp_01j9z3k4m5n6p7q8r9s0t1v2w4",
          path: "platform.acme",
          name: "Acme",
          role: "admin",
          roles: ["admin", "staff"],
        },
      ],
    });
  });

  it("falls back to the address and to no permissions or memberships", () => {
    const user = sessionUserOf({
      email: "rana@acme.example",
      [IDENTITY_CLAIMS.userId]: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
    });
    expect(user.displayName).toBe("rana@acme.example");
    expect(user.permissions).toEqual([]);
    expect(user.tenants).toEqual([]);
    expect("avatarUrl" in user).toBe(false);
  });

  it.each([
    ["no Stackra user id", { ...CLAIMS, [IDENTITY_CLAIMS.userId]: undefined }],
    ["no address", { ...CLAIMS, email: undefined }],
    [
      "a membership without a role",
      {
        ...CLAIMS,
        [IDENTITY_CLAIMS.memberships]: [{ ...CLAIMS[IDENTITY_CLAIMS.memberships][0], roles: [] }],
      },
    ],
  ])("refuses %s", (_case, claims) => {
    expect(() => sessionUserOf(claims)).toThrow(UnauthenticatedError);
  });
});
