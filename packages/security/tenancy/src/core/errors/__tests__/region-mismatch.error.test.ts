/**
 * Stackra file contract:
 * Purpose: unit and type tests of `RegionMismatchError`: a `FailedPrecondition` refusal (HTTP 412) with code
 *          `region_mismatch`, not retryable, whose typed `create` takes the tenant's region key.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0353; stackra-310.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { RegionMismatchError } from "#core/errors/region-mismatch.error";

describe("RegionMismatchError", () => {
  it("is a FailedPrecondition refusal with code region_mismatch", () => {
    const refused = RegionMismatchError.create({ region: "eu" });
    expect(isRefusal(refused, RegionMismatchError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refused.code).toBe("region_mismatch");
    expect(refused.retryable).toBe(false);
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(412);
  });

  it("carries the region key in its envelope", () => {
    expect(RegionMismatchError.envelope({ region: "eu" })).toEqual({
      code: "region_mismatch",
      category: "precondition_failed",
      retryable: false,
      details: { region: "eu" },
    });
  });

  it("requires its details", () => {
    // @ts-expect-error -- `region` is required
    expect(RegionMismatchError.create().code).toBe("region_mismatch");
  });
});
