/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `SecondScreen` port: keyed `platform.SecondScreen`, its memory driver an
 *          instance.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0339 (open question 3); ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SecondScreen } from "#contracts/ports/second-screen.port";
import type { CapabilityResult } from "#contracts/types/capability-result.type";
import { MemorySecondScreenDriver } from "#core/drivers/memory-second-screen.driver";

describe("SecondScreen", () => {
  it("is a port its drivers are instances of", () => {
    const screen = new MemorySecondScreenDriver();
    expect(screen).toBeInstanceOf(SecondScreen);
    expect(screen).toBeInstanceOf(Port);
  });

  it("is keyed platform.SecondScreen and types its calls", () => {
    expectTypeOf<SecondScreen["~key"]>().toEqualTypeOf<"platform.SecondScreen">();
    expectTypeOf<SecondScreen["open"]>().returns.toEqualTypeOf<Promise<CapabilityResult>>();
  });
});
