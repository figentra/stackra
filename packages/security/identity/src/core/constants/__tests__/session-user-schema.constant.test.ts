/**
 * Stackra file contract:
 * Purpose: unit tests of `SESSION_USER_SCHEMA`: a user with memberships parses, unknown keys are dropped, and a wrong
 *          id prefix, a bad address or a membership without a role is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0206 (decision 2); ADR 0327 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { SESSION_USER_SCHEMA } from "#core/constants/session-user-schema.constant";

/** A valid user. */
const USER = {
  userId: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
  email: "rana@acme.example",
  displayName: "Rana",
  avatarUrl: "https://cdn.acme.example/rana.png",
  permissions: ["orders.order.read"],
  memberships: [
    {
      tenantId: "scp_01j9z3k4m5n6p7q8r9s0t1v2w4",
      path: "platform.acme",
      name: "Acme",
      role: "admin",
      roles: ["admin", "staff"],
    },
  ],
};

describe("SESSION_USER_SCHEMA", () => {
  it("parses a user and drops unknown keys", () => {
    expect(SESSION_USER_SCHEMA.parse({ ...USER, sub: "312909075212468632" })).toEqual(USER);
  });

  it("leaves a missing picture out", () => {
    const { avatarUrl: _omitted, ...user } = USER;
    expect("avatarUrl" in SESSION_USER_SCHEMA.parse(user)).toBe(false);
  });

  it.each([
    ["a provider subject id", { ...USER, userId: "312909075212468632" }],
    ["a bad address", { ...USER, email: "rana" }],
    [
      "a membership without a role",
      { ...USER, memberships: [{ ...USER.memberships[0], roles: [] }] },
    ],
    [
      "a membership with an ord_ id",
      {
        ...USER,
        memberships: [{ ...USER.memberships[0], tenantId: "ord_01j9z3k4m5n6p7q8r9s0t1v2w4" }],
      },
    ],
  ])("refuses %s", (_case, value) => {
    expect(SESSION_USER_SCHEMA.safeParse(value).success).toBe(false);
  });
});
