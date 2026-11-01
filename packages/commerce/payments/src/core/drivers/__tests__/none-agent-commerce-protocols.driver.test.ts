/**
 * Stackra file contract:
 * Purpose: unit tests of `NoneAgentCommerceProtocolsDriver`: every proof under every protocol answers null.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1704.
 */
import { describe, expect, it } from "@stackra/testing";

import { NoneAgentCommerceProtocolsDriver } from "#core/drivers/none-agent-commerce-protocols.driver";

describe("NoneAgentCommerceProtocolsDriver", () => {
  it("confirms nothing", async () => {
    const protocols = new NoneAgentCommerceProtocolsDriver();
    await expect(protocols.confirmation("acp", "proof")).resolves.toBeNull();
    await expect(protocols.confirmation("ap2", "")).resolves.toBeNull();
  });
});
