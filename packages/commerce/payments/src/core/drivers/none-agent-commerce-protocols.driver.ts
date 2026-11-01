/**
 * Stackra file contract:
 * Purpose: `NoneAgentCommerceProtocolsDriver`, the `none` driver of `AgentCommerceProtocols`: no agent commerce
 *          protocol is on, so every proof answers null and an agent's checkout is never confirmed by a protocol. The
 *          go-live choice (owner decision 2026-10-31, STA-1704), consistent with agents never confirming a payment.
 * Boundary: holds nothing and calls nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 2); STA-1704.
 */
import { Driver } from "@stackra/container";

import { AgentCommerceProtocols } from "#contracts/ports/agent-commerce-protocols.port";
import type { AgentConfirmation } from "#contracts/types/agent-confirmation.type";

/**
 * No agent commerce protocol.
 *
 * @example
 * await new NoneAgentCommerceProtocolsDriver().confirmation("acp", proof); // null
 */
export class NoneAgentCommerceProtocolsDriver extends Driver(AgentCommerceProtocols) {
  /** Null: no protocol is on. */
  async confirmation(_protocol: string, _proof: string): Promise<AgentConfirmation | null> {
    return null;
  }
}
