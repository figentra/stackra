/**
 * Stackra file contract:
 * Purpose: `AgentConfirmationRefusedError` (`agent_confirmation_refused`), the refusal of an agent payment the shopper
 *          did not confirm in their wallet for this cart: no confirmation (`missing`), one for another reference
 *          (`reference`), past its time (`expired`) or for less, or another currency (`amount`).
 * Boundary: kind `Forbidden`, not retryable as it stands: the agent must get a new confirmation from the
 *           shopper. Carries the reference, the protocol and the reason code only, never the proof.
 * Runtime: isomorphic
 * Governing contract: ADR 0446; ADR 0140; COM-125.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * An agent never pays alone.
 *
 * @example
 * throw AgentConfirmationRefusedError.create({ reference: "cart_1", protocol: "acp", reason: "expired" });
 */
export class AgentConfirmationRefusedError extends Refusal({
  kind: ErrorKind.Forbidden,
  retryable: false,
}) {
  /** The merchant reference asked for. */
  reference!: string;

  /** The protocol code. */
  protocol!: string;

  /** `missing`, `reference`, `expired` or `amount`. */
  reason!: string;
}
