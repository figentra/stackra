/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the plan builder, its two enums and its error are exported,
 *          nothing else is (the `observability` zod schema stays internal), the entry loads without Pulumi, and the
 *          public types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import type { RootRunway } from "@stackra/runway";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as observability from "#core/index";
import type {
  HeartbeatKind,
  HeartbeatSource,
  ObservabilityMembers,
  ObservabilityPlan,
  ServiceSli,
  SliKind,
} from "#core/index";

describe("@stackra/infra-observability", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(observability).sort()).toEqual([
      "HeartbeatKind",
      "InfraObservabilityConfig",
      "InfraObservabilityConfig$",
      "ObservabilityConfigInvalidError",
      "ObservabilityHealthIndicatorDriver",
      "SliKind",
      "observabilityPlan",
    ]);
  });

  it("types the plan builder", () => {
    expectTypeOf(observability.observabilityPlan).parameters.toEqualTypeOf<
      [root: RootRunway, members: ObservabilityMembers]
    >();
    expectTypeOf(observability.observabilityPlan).returns.toEqualTypeOf<ObservabilityPlan>();
  });

  it("resolves the public types", () => {
    expectTypeOf<HeartbeatSource["kind"]>().toEqualTypeOf<HeartbeatKind>();
    expectTypeOf<ObservabilityPlan["slis"]>().toEqualTypeOf<readonly ServiceSli[]>();
    expectTypeOf<ServiceSli["kind"]>().toEqualTypeOf<SliKind>();
  });
});
