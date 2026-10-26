/**
 * Stackra file contract:
 * Purpose: unit tests of `catalogueDecisionOf`: a pending discount can be approved only by someone other than its
 *          proposer, who may still withdraw it; a decided version offers no decision.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0391 (decision 4); owner OS-381.
 */
import { describe, expect, it } from "@stackra/testing";

import { catalogueDecisionOf } from "#core/functions/catalogue-decision-of.function";

describe("catalogueDecisionOf", () => {
  const pending = { state: "pending", proposedBy: "usr_rana" } as const;

  it("lets a second person approve or reject a pending discount", () => {
    expect(catalogueDecisionOf(pending, "usr_omar")).toEqual({
      canApprove: true,
      canReject: true,
      isOwn: false,
    });
  });

  it("lets the proposer withdraw but never approve", () => {
    expect(catalogueDecisionOf(pending, "usr_rana")).toEqual({
      canApprove: false,
      canReject: true,
      isOwn: true,
    });
  });

  it("offers nothing on a decided version", () => {
    expect(catalogueDecisionOf({ state: "approved", proposedBy: "usr_rana" }, "usr_omar")).toEqual({
      canApprove: false,
      canReject: false,
      isOwn: false,
    });
  });
});
