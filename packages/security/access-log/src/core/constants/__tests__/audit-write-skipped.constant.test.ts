/**
 * Stackra file contract:
 * Purpose: unit test of `AUDIT_WRITE_SKIPPED`: the stable snake_case log event of an audit entry the Postgres store
 *          could not hold.
 * Boundary: test only.
 * Runtime: isomorphic (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231.
 */
import { describe, expect, it } from "@stackra/testing";

import { AUDIT_WRITE_SKIPPED } from "#core/constants/audit-write-skipped.constant";

describe("AUDIT_WRITE_SKIPPED", () => {
  it("is a stable snake_case code", () => {
    expect(AUDIT_WRITE_SKIPPED).toBe("audit_write_skipped");
  });
});
