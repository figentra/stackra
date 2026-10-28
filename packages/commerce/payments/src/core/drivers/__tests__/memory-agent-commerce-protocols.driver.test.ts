/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryAgentCommerceProtocolsDriver`: a proof answers its confirmation under its own protocol
 *          only, and an unknown proof answers null.
 * Boundary: test only; pure in-memory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0266; ADR 0446.
 */
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { MemoryAgentCommerceProtocolsDriver } from "#core/drivers/memory-agent-commerce-protocols.driver";

const confirmation = {
  protocol: "acp",
  agent: "agent_1",
  reference: "cart_1",
  amount: Money.ofMinor(5000, "USD"),
  confirmedAt: new Date("2026-10-27T10:00:00Z"),
  expiresAt: new Date("2026-10-27T10:15:00Z"),
  method: { provider: "fake", connectionId: "conn_fake", token: "spt_1", merchantInitiated: false },
};

describe("MemoryAgentCommerceProtocolsDriver", () => {
  it("answers a proof under its protocol only", async () => {
    const agents = new MemoryAgentCommerceProtocolsDriver().confirm("proof_1", confirmation);
    expect(await agents.confirmation("acp", "proof_1")).toEqual(confirmation);
    expect(await agents.confirmation("ap2", "proof_1")).toBeNull();
    expect(await agents.confirmation("acp", "proof_2")).toBeNull();
  });
});
