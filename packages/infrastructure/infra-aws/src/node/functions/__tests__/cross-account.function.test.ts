/**
 * Stackra file contract:
 * Purpose: unit tests of `crossAccount`: the account root as principal, the role ARNs as an `aws:PrincipalArn`
 *          condition when given, and any extra condition operators kept.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0172 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { crossAccount } from "#node/functions/cross-account.function";

describe("crossAccount", () => {
  it("names the account root and no condition when every role may use it", () => {
    expect(crossAccount({ account: "111111111111" })).toEqual({
      Principal: { AWS: "arn:aws:iam::111111111111:root" },
    });
  });

  it("limits the principal to the roles named", () => {
    const roles = ["arn:aws:iam::111111111111:role/acme-staging-infra"];

    expect(crossAccount({ account: "111111111111", roles })).toEqual({
      Principal: { AWS: "arn:aws:iam::111111111111:root" },
      Condition: { ArnLike: { "aws:PrincipalArn": roles } },
    });
  });

  it("keeps the extra operators beside the role condition", () => {
    const condition = { Bool: { "kms:GrantIsForAWSResource": "true" } };

    expect(
      crossAccount({ account: "111111111111", roles: ["arn:aws:iam::1:role/x"] }, condition)
        .Condition,
    ).toEqual({ ...condition, ArnLike: { "aws:PrincipalArn": ["arn:aws:iam::1:role/x"] } });
    expect(crossAccount({ account: "111111111111" }, condition).Condition).toEqual(condition);
  });
});
