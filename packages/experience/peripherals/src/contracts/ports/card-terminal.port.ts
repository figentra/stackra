/**
 * Stackra file contract:
 * Purpose: the `CardTerminal` port: pairing an integrated card terminal to the till and reporting its state. The
 *          payment itself (amount, tip prompt, outcome) is the payments driver's protocol; this port only pairs and
 *          reports. Config `peripherals.cardTerminal` picks the driver.
 * Boundary: an abstract class that is its own token, keyed `peripherals.CardTerminal`. Each provider's SDK driver is a
 *           native module that needs its own ADR (ADR 0339 open question 1); this package ships the `memory` driver.
 *           Refusals use capability `bluetooth` for a terminal that cannot be reached.
 * Runtime: isomorphic
 * Governing contract: ADR 0339 (decision 1 and open question 1); ADR 0250 (decision 3); ADR 0294 (decisions 15 and 16).
 */
import { Port } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";

import type { PairedTerminal } from "#contracts/types/paired-terminal.type";
import type { TerminalPairing } from "#contracts/types/terminal-pairing.type";

/**
 * The integrated card terminal.
 *
 * @example
 * const paired = await terminal.pair({ terminalId: "T-0042", provider: "geidea", address: null });
 * const state = await terminal.status(); // { ok: true, data: { terminalId, provider, state: "ready" } }
 */
export abstract class CardTerminal extends Port {
  /** Type-only port key, so `DriverName<CardTerminal>` narrows to this port's drivers. */
  declare readonly "~key": "peripherals.CardTerminal";

  /** Pairs the terminal to this till, replacing any terminal paired before. */
  abstract pair(pairing: TerminalPairing): Promise<CapabilityResult<PairedTerminal>>;

  /** The paired terminal and its state; refuses with `unavailable` when none is paired. */
  abstract status(): Promise<CapabilityResult<PairedTerminal>>;

  /** Forgets the paired terminal; succeeds when none is paired. */
  abstract unpair(): Promise<CapabilityResult>;
}
