/**
 * Stackra file contract:
 * Purpose: unit tests of the `HealthIndicator` port: a `Port` an implementation names itself through and answers a
 *          `HealthReport` from.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 16).
 */
import { describe, expect, it } from "@stackra/testing";

import { Port } from "#core/bases/port.base";
import { HealthStatus } from "#core/enums/health-status.enum";
import { HealthIndicator } from "#core/ports/health-indicator.port";
import type { HealthReport } from "#core/types/health-report.type";

class AlwaysUp extends HealthIndicator {
  override readonly name = "memory";

  override async check(): Promise<HealthReport> {
    return { status: HealthStatus.Up };
  }
}

describe("HealthIndicator", () => {
  it("is a port an implementation extends", () => {
    const indicator = new AlwaysUp();
    expect(indicator).toBeInstanceOf(HealthIndicator);
    expect(indicator).toBeInstanceOf(Port);
    expect(Object.getPrototypeOf(HealthIndicator)).toBe(Port);
  });

  it("is named and answers a report", async () => {
    const indicator: HealthIndicator = new AlwaysUp();
    expect(indicator.name).toBe("memory");
    expect(await indicator.check()).toEqual({ status: "up" });
  });
});
