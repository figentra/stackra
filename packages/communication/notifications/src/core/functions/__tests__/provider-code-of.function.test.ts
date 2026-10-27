/**
 * Stackra file contract:
 * Purpose: unit tests of `providerCodeOf`: the map key whose class built the Connection, else its class name.
 * Boundary: test only; the connection classes are stand-ins.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0356; stackra-207 (STA-1360).
 */
import type { ProviderDrivers } from "@stackra/integrations";
import { describe, expect, it } from "@stackra/testing";

import { providerCodeOf } from "#core/functions/provider-code-of.function";

class TwilioStandIn {}
class UnifonicStandIn {}
class UnmappedStandIn {}

const DRIVERS = {
  twilio: TwilioStandIn,
  unifonic: UnifonicStandIn,
} as unknown as ProviderDrivers<object>;

describe("providerCodeOf", () => {
  it("answers the code of the class that built the connection", () => {
    expect(providerCodeOf(DRIVERS, new UnifonicStandIn())).toBe("unifonic");
    expect(providerCodeOf(DRIVERS, new TwilioStandIn())).toBe("twilio");
  });

  it("answers the class name when the class is not in the map", () => {
    expect(providerCodeOf(DRIVERS, new UnmappedStandIn())).toBe("UnmappedStandIn");
  });
});
