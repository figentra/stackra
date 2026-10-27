/**
 * Stackra file contract:
 * Purpose: `MemoryAgentCommerceProtocolsDriver`, an in-memory `AgentCommerceProtocols` for tests and development: a test
 *          records the confirmation a proof stands for under a protocol, as if the shopper had confirmed it in their
 *          wallet.
 * Boundary: the memory driver every port ships before its durable one (ADR 0266); its name is the file prefix
 *           (`memory`). Isomorphic, so it ships from the `.` entry. It verifies nothing; production binds the protocol
 *           connectors of the OS integrations service.
 * Runtime: isomorphic
 * Governing contract: ADR 0446; ADR 0266 (decision 2); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";

import { AgentCommerceProtocols } from "#contracts/ports/agent-commerce-protocols.port";
import type { AgentConfirmation } from "#contracts/types/agent-confirmation.type";

/**
 * Confirmations in a Map.
 *
 * @example
 * const agents = new MemoryAgentCommerceProtocolsDriver().confirm("proof_1", confirmation);
 */
export class MemoryAgentCommerceProtocolsDriver extends Driver(AgentCommerceProtocols) {
  /** Confirmations by `<protocol>:<proof>`. */
  private readonly confirmations = new Map<string, AgentConfirmation>();

  /** Makes `proof` stand for `confirmation` under its protocol; returns this driver. */
  confirm(proof: string, confirmation: AgentConfirmation): this {
    this.confirmations.set(`${confirmation.protocol}:${proof}`, confirmation);
    return this;
  }

  /** The confirmation recorded for `proof` under `protocol`, or null. */
  async confirmation(protocol: string, proof: string): Promise<AgentConfirmation | null> {
    return this.confirmations.get(`${protocol}:${proof}`) ?? null;
  }
}
