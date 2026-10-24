/**
 * Stackra file contract:
 * Purpose: unit and type tests of `PipelineStage`: an `Enum.of` enum holding the fixed order of ADR 0138 as amended, with interceptors and the rate limit before handle, codes in source order, with a
 *          same-named type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { PipelineStage } from "#core/enums/pipeline-stage.enum";

describe("PipelineStage", () => {
  it("holds its snake_case codes in order", () => {
    expect(Enum.values(PipelineStage)).toEqual([
      "tenancy",
      "permission",
      "precondition",
      "entitlement",
      "flag",
      "idempotency",
      "rate_limit",
      "interceptors",
      "handle",
    ]);
    expect(PipelineStage.Tenancy).toBe("tenancy");
    expect(PipelineStage.Permission).toBe("permission");
    expect(PipelineStage.Precondition).toBe("precondition");
    expect(PipelineStage.Entitlement).toBe("entitlement");
    expect(PipelineStage.Flag).toBe("flag");
    expect(PipelineStage.Idempotency).toBe("idempotency");
    expect(PipelineStage.RateLimit).toBe("rate_limit");
    expect(PipelineStage.Interceptors).toBe("interceptors");
    expect(PipelineStage.Handle).toBe("handle");
  });

  it("types its values", () => {
    expectTypeOf<PipelineStage>().toEqualTypeOf<
      | "tenancy"
      | "permission"
      | "precondition"
      | "entitlement"
      | "flag"
      | "idempotency"
      | "rate_limit"
      | "interceptors"
      | "handle"
    >();
  });
});
