/**
 * Stackra file contract:
 * Purpose: unit test of `AnalyticsBatchPermissions`: `ingest` is a grantable L2 permission.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0483 (decision 4).
 */
import { Permission, Permissions, Risk } from "@stackra/iam";
import { describe, expect, it } from "@stackra/testing";

import { AnalyticsBatchPermissions } from "#node/access/analytics-batch.permissions";

describe("AnalyticsBatchPermissions", () => {
  it("declares ingest as a grantable L2 permission", () => {
    expect(Object.getPrototypeOf(AnalyticsBatchPermissions)).toBe(Permissions);
    expect(AnalyticsBatchPermissions.ingest).toBeInstanceOf(Permission);
    expect(AnalyticsBatchPermissions.ingest.risk).toBe(Risk.L2);
    expect(AnalyticsBatchPermissions.ingest.isSystem).toBe(false);
  });
});
