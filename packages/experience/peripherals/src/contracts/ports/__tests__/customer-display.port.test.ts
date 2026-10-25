/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `CustomerDisplay` port: keyed `peripherals.CustomerDisplay`, both shipped
 *          drivers instances of it.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0339; ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { CustomerDisplay } from "#contracts/ports/customer-display.port";
import { ChannelCustomerDisplayDriver } from "#core/drivers/channel-customer-display.driver";
import { MemoryCustomerDisplayDriver } from "#core/drivers/memory-customer-display.driver";

describe("CustomerDisplay", () => {
  it("is a port its drivers are instances of", () => {
    for (const display of [new MemoryCustomerDisplayDriver(), new ChannelCustomerDisplayDriver()]) {
      expect(display).toBeInstanceOf(CustomerDisplay);
      expect(display).toBeInstanceOf(Port);
    }
  });

  it("is keyed peripherals.CustomerDisplay and types its calls", () => {
    expectTypeOf<CustomerDisplay["~key"]>().toEqualTypeOf<"peripherals.CustomerDisplay">();
    expectTypeOf<CustomerDisplay["show"]>().returns.toEqualTypeOf<Promise<CapabilityResult>>();
  });
});
