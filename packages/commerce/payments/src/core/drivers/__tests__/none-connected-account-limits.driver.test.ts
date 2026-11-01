/**
 * Stackra file contract:
 * Purpose: unit tests of `NoneConnectedAccountLimitsDriver`: both questions refuse with
 *          `ConnectedAccountLimitsMissingError` naming the connection.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; STA-1707.
 */
import { refusal } from "@stackra/errors/testing";
import { describe, expect, it } from "@stackra/testing";

import { NoneConnectedAccountLimitsDriver } from "#core/drivers/none-connected-account-limits.driver";
import { ConnectedAccountLimitsMissingError } from "#core/errors/connected-account-limits-missing.error";

describe("NoneConnectedAccountLimitsDriver", () => {
  it("fails closed on both questions", async () => {
    const limits = new NoneConnectedAccountLimitsDriver();
    const missing = refusal(ConnectedAccountLimitsMissingError, { connectionId: "conn_1" });
    await expect(limits.cap("conn_1")).rejects.toRefuseWith(missing);
    await expect(limits.payoutHeld("conn_1")).rejects.toRefuseWith(missing);
  });
});
