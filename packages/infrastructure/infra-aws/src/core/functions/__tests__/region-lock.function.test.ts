/**
 * Stackra file contract:
 * Purpose: unit tests of `regionLock`: one deny on every non-global action outside the given regions, the exempt
 *          principals skipped, no exemption condition when none is given, and no lock without a region.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0172, ADR 0524.
 */
import { describe, expect, it } from "@stackra/testing";

import { GLOBAL_ACTIONS } from "#core/constants/global-actions.constant";
import { regionLock } from "#core/functions/region-lock.function";

describe("regionLock", () => {
  it("denies every non-global action outside the regions, except for the exempt principals", () => {
    expect(
      regionLock({
        sid: "OnlyMeCentral1",
        regions: ["me-central-1"],
        exempt: ["arn:aws:iam::*:role/OrganizationAccountAccessRole"],
      }),
    ).toEqual({
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "OnlyMeCentral1",
          Effect: "Deny",
          NotAction: GLOBAL_ACTIONS,
          Resource: "*",
          Condition: {
            StringNotEquals: { "aws:RequestedRegion": ["me-central-1"] },
            ArnNotLike: {
              "aws:PrincipalArn": ["arn:aws:iam::*:role/OrganizationAccountAccessRole"],
            },
          },
        },
      ],
    });
  });

  it("keeps IAM, STS and Organizations global", () => {
    expect(GLOBAL_ACTIONS).toEqual(expect.arrayContaining(["iam:*", "sts:*", "organizations:*"]));
  });

  it("adds no exemption condition when none is given", () => {
    const lock = regionLock({ sid: "Only", regions: ["eu-central-1"], exempt: [] }) as {
      Statement: { Condition: object }[];
    };
    expect(Object.keys(lock.Statement[0]?.Condition ?? {})).toEqual(["StringNotEquals"]);
  });

  it("refuses a lock with no region", () => {
    expect(() => regionLock({ sid: "Only", regions: [], exempt: [] })).toThrow(TypeError);
  });
});
