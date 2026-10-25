/**
 * Stackra file contract:
 * Purpose: unit tests of `PaymentGatewaysFake`: the first gateway with every need serves a Market, a connection is
 *          found by provider and id, and anything else is `NoPaymentProviderError`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269.
 */
import { refusal } from "@stackra/errors/testing";
import { describe, expect, it } from "@stackra/testing";

import { PaymentCapability } from "#contracts/enums/payment-capability.enum";
import { NoPaymentProviderError } from "#core/errors/no-payment-provider.error";
import { PaymentGatewayFake } from "#testing/payment-gateway.fake";
import { PaymentGatewaysFake } from "#testing/payment-gateways.fake";

describe("PaymentGatewaysFake", () => {
  const hosted = PaymentGatewayFake.with({ id: "conn_a", provider: "a", capabilities: [] });
  const full = PaymentGatewayFake.with({ id: "conn_b", provider: "b" });
  const gateways = PaymentGatewaysFake.with([hosted, full]);

  it("gives the first gateway with every need", async () => {
    expect(await gateways.forMarket("m1", [])).toBe(hosted);
    expect(await gateways.forMarket("m1", [PaymentCapability.Capture])).toBe(full);
  });

  it("finds a connection by provider and id", async () => {
    expect(await gateways.byConnection("b", "conn_b")).toBe(full);
    await expect(gateways.byConnection("b", "conn_a")).rejects.toRefuseWith(
      refusal(NoPaymentProviderError),
    );
  });
});
