/**
 * Stackra file contract:
 * Purpose: unit tests of `capabilityGuard`: the guard is true only for a capability the gateway lists, narrows the
 *          gateway to that capability's interface, and refuses a code outside the map at compile time.
 * Boundary: test only; literal gateways stand in for drivers.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; STA-1383.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { capabilityGuard } from "#core/functions/capability-guard.function";

interface Gateway {
  readonly id: string;
  readonly capabilities: readonly ("refunds" | "tokens")[];
}

interface RefundGateway {
  refund(amount: number): Promise<void>;
}

interface Gateways {
  readonly refunds: RefundGateway;
  readonly tokens: { tokenize(): Promise<string> };
}

const hasGatewayCapability = capabilityGuard<Gateways>();
const gateway: Gateway = { id: "g_1", capabilities: ["refunds"] };

describe("capabilityGuard", () => {
  it("is true only for a listed capability", () => {
    expect(hasGatewayCapability(gateway, "refunds")).toBe(true);
    expect(hasGatewayCapability(gateway, "tokens")).toBe(false);
  });

  it("narrows to the capability's interface and refuses a code outside the map", () => {
    if (hasGatewayCapability(gateway, "refunds")) expectTypeOf(gateway).toMatchTypeOf<RefundGateway>();
    // @ts-expect-error -- not a capability of the map
    expect(hasGatewayCapability(gateway, "payouts")).toBe(false);
  });
});
