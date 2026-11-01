/**
 * Stackra file contract:
 * Purpose: unit tests of the `ApprovalBinding` model: a model with a public id (`apr_`), the tenant owner trait and the
 *          append-only trait.
 * Boundary: test only; no database runs (the integration test proves the policy and the grants).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0509 (N7); ADR 0321.
 */
import { Model, traitsOf } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { ApprovalBinding } from "#node/models/approval-binding.model";

describe(ApprovalBinding, () => {
  it("is a model that is public-id keyed, tenant-owned and append-only", () => {
    expect(new ApprovalBinding()).toBeInstanceOf(Model);
    expect(traitsOf(ApprovalBinding).map((trait) => trait.name)).toEqual([
      "has_public_id",
      "belongs_to_tenant",
      "append_only",
    ]);
  });
});
