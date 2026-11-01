/**
 * Stackra file contract:
 * Purpose: unit tests of `mergeApprovalRequirements`: nothing with nothing, one side alone, the larger count, the
 *          declared permission, the shorter window, the stronger approver level and `confirm`, and that a weaker
 *          decision never lowers the declaration.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0509; STA-1724 (P-004).
 */
import { AssuranceLevel } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { mergeApprovalRequirements } from "#core/functions/merge-approval-requirements.function";

describe(mergeApprovalRequirements, () => {
  it("is undefined with no requirement and the other side when one is missing", () => {
    const one = { approvals: 1, expiresAfter: "72h" };
    expect(mergeApprovalRequirements(undefined, undefined)).toBeUndefined();
    expect(mergeApprovalRequirements(one, undefined)).toEqual(one);
    expect(mergeApprovalRequirements(undefined, one)).toEqual(one);
  });

  it("keeps the larger count and the declared permission", () => {
    expect(
      mergeApprovalRequirements(
        { approvals: 2, permission: "billing.coupon.approve", expiresAfter: "72h" },
        { approvals: 3, permission: "other.approve", expiresAfter: "72h" },
      ),
    ).toEqual({ approvals: 3, permission: "billing.coupon.approve", expiresAfter: "72h" });
  });

  it("takes the decided permission when the declaration has none", () => {
    expect(
      mergeApprovalRequirements(
        { approvals: 1, expiresAfter: "72h" },
        { approvals: 1, permission: "rules.approve", expiresAfter: "72h" },
      ),
    ).toMatchObject({ permission: "rules.approve" });
  });

  it("takes the shorter window and the stronger approver level, and either confirm", () => {
    expect(
      mergeApprovalRequirements(
        { approvals: 1, expiresAfter: "72h", approverLevel: AssuranceLevel.Aal2 },
        { approvals: 1, expiresAfter: "24h", approverLevel: AssuranceLevel.Aal1, confirm: true },
      ),
    ).toEqual({ approvals: 1, expiresAfter: "24h", approverLevel: "aal2", confirm: true });
    expect(
      mergeApprovalRequirements(
        { approvals: 1, expiresAfter: "24h" },
        { approvals: 1, expiresAfter: "72h", approverLevel: AssuranceLevel.Aal3 },
      ),
    ).toEqual({ approvals: 1, expiresAfter: "24h", approverLevel: "aal3" });
  });

  it("never lowers the declaration: a weaker decision changes nothing", () => {
    const declared = { approvals: 2, expiresAfter: "48h", approverLevel: AssuranceLevel.Aal2 };
    expect(mergeApprovalRequirements(declared, { approvals: 1, expiresAfter: "720h" })).toEqual(
      declared,
    );
  });
});
