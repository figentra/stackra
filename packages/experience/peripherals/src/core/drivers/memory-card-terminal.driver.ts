/**
 * Stackra file contract:
 * Purpose: `MemoryCardTerminalDriver`, the `CardTerminal` driver that pairs in memory: the `memory` candidate
 *          (`peripherals.cardTerminal: "memory"`), the driver of tests and of a till taking no integrated card
 *          payments.
 * Boundary: no device is touched. `state` is what a paired terminal reports; a test sets `isReachable = false` to see
 *           pairing refuse with `unavailable` (capability `card_terminal`). The constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0339 (decision 1 and open question 1); ADR 0266 (memory drivers first); ADR 0269.
 */
import { Driver } from "@stackra/container";
import { PlatformCapability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { TerminalState } from "#contracts/enums/terminal-state.enum";
import { CardTerminal } from "#contracts/ports/card-terminal.port";
import type { PairedTerminal } from "#contracts/types/paired-terminal.type";
import type { TerminalPairing } from "#contracts/types/terminal-pairing.type";
import { refuse } from "#core/functions/refuse.function";

/**
 * A card terminal in memory.
 *
 * @example
 * const terminal = new MemoryCardTerminalDriver();
 * await terminal.pair({ terminalId: "T-1", provider: "memory", address: null });
 * terminal.state = TerminalState.Busy;
 */
export class MemoryCardTerminalDriver extends Driver(CardTerminal) {
  /** Whether a terminal can be reached for pairing. */
  isReachable = true;

  /** What the paired terminal reports. */
  state: TerminalState = TerminalState.Ready;

  /** The paired terminal; null when none is paired. */
  paired: TerminalPairing | null = null;

  /** Pairs while reachable. */
  async pair(pairing: TerminalPairing): Promise<CapabilityResult<PairedTerminal>> {
    if (!this.isReachable) return refuse(PlatformCapability.CardTerminal, "unavailable");
    this.paired = pairing;
    return this.status();
  }

  /** The paired terminal and `state`. */
  async status(): Promise<CapabilityResult<PairedTerminal>> {
    if (this.paired === null) return refuse(PlatformCapability.CardTerminal, "unavailable");
    const { terminalId, provider } = this.paired;
    return { ok: true, data: { terminalId, provider, state: this.state } };
  }

  /** Forgets the pairing. */
  async unpair(): Promise<CapabilityResult> {
    this.paired = null;
    return { ok: true, data: undefined };
  }
}
