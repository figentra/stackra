/**
 * Stackra file contract:
 * Purpose: unit and type tests of `HealthStatus`: an `Enum.of` with the codes up, down and degraded, in that order.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 16).
 */
import { describe, expect, it } from "@stackra/testing";

import { Enum } from "#core/bases/enum.base";
import { HealthStatus } from "#core/enums/health-status.enum";

describe("HealthStatus", () => {
  it("holds exactly these codes, in this order", () => {
    expect(Enum.values(HealthStatus)).toEqual(["up", "down", "degraded"]);
    expect(HealthStatus.Degraded).toBe("degraded");
    expect(Object.isFrozen(HealthStatus)).toBe(true);
  });

  it("has a type of the same name that refuses other strings", () => {
    const code: HealthStatus = HealthStatus.Up;
    // @ts-expect-error -- not a code of HealthStatus
    const wrong: HealthStatus = "broken";
    expect([code, wrong]).toEqual(["up", "broken"]);
  });
});
