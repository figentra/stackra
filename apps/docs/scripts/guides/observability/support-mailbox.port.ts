/**
 * Stackra file contract:
 * Purpose: `SupportMailbox`, the example port of the "Observability" guide: the mail provider support tickets arrive
 *          through, which the app cannot work without.
 * Boundary: the port only; a host binds its provider's driver, and the guide's tests bind a stand-in. `ping` answers
 *           whether the provider is reachable and does nothing else.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (ports and drivers); STA-2852.
 */
import { Port } from "@stackra/contracts";

/** The inbound support mailbox. */
export abstract class SupportMailbox extends Port {
  /** Resolves when the provider answers; rejects when it cannot be reached. */
  abstract ping(): Promise<void>;
}
