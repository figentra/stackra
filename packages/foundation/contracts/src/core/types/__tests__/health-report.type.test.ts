/**
 * Stackra file contract:
 * Purpose: type tests of `HealthReport`: the status is required, the detail and the latency are optional, and the
 *          latency is a `Duration`.
 * Boundary: test only; the assertions are compile-time plus runtime checks of the same values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Duration } from "#core/constants/duration.constant";
import { HealthStatus } from "#core/enums/health-status.enum";
import type { HealthReport } from "#core/types/health-report.type";

describe("HealthReport", () => {
  it("needs only a status", () => {
    const report: HealthReport = { status: HealthStatus.Up };
    expect(report.detail).toBeUndefined();
    expect(report.latency).toBeUndefined();
  });

  it("carries a detail and a Duration latency", () => {
    const report: HealthReport = {
      status: HealthStatus.Degraded,
      detail: "replica lagging",
      latency: Duration.seconds(2),
    };
    expect(report.latency).toBe("PT2S");
    expectTypeOf<HealthReport["latency"]>().toEqualTypeOf<Duration | undefined>();
    // @ts-expect-error -- the status is required
    const empty: HealthReport = {};
    expect(empty).toEqual({});
  });
});
