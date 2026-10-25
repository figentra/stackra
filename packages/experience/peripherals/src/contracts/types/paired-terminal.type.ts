/**
 * Stackra file contract:
 * Purpose: `PairedTerminal`, a card terminal paired to this till, and its state when asked.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0339 (decision 1: `CardTerminal` pairs and reports).
 */
import type { TerminalState } from "#contracts/enums/terminal-state.enum";

/** The paired terminal. */
export interface PairedTerminal {
  /** The terminal's id at its provider. */
  readonly terminalId: string;

  /** The provider key. */
  readonly provider: string;

  /** Its state now. */
  readonly state: TerminalState;
}
