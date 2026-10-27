/**
 * Stackra file contract:
 * Purpose: `AgentCommerceProtocols`, the port that verifies an agent commerce protocol's proof that the shopper
 *          confirmed a payment in their own wallet, and answers what was confirmed (`AgentConfirmation`).
 * Boundary: an abstract class that is its own token, key `payments.AgentCommerceProtocols`. The host binds it over the
 *           protocol connectors of the OS integrations service (which protocols are on is a connector catalogue row
 *           per pack, opted in per channel); the `memory` driver serves tests. This package names no protocol and
 *           no agent platform. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0446; ADR 0443 (connectors in OS integrations); ADR 0294 (decision 16); COM-125; STA-764.
 */
import { Port } from "@stackra/contracts";

import type { AgentConfirmation } from "#contracts/types/agent-confirmation.type";

/**
 * Wallet confirmations of agent payments.
 *
 * @example
 * export class OsAgentCommerceProtocolsDriver extends Driver(AgentCommerceProtocols) { … }
 */
export abstract class AgentCommerceProtocols extends Port {
  /** Type-only port key. */
  declare readonly "~key": "payments.AgentCommerceProtocols";

  /**
   * The confirmation `proof` carries under `protocol`, once its signature or token is verified.
   *
   * @returns null when the protocol is not on, or the proof does not verify.
   */
  abstract confirmation(protocol: string, proof: string): Promise<AgentConfirmation | null>;
}
