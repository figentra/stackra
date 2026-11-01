/**
 * Stackra file contract:
 * Purpose: `ApprovalGateHarness`, what a driver gives the `ApprovalGate` conformance suite: the gate, its pending cap,
 *          and the store-specific moves the port does not carry (`grant`, `reject`, `withdraw`).
 * Boundary: a type only, for tests; a vote is the store's own action, so each driver supplies its own.
 * Runtime: node
 * Governing contract: ADR 0509 (port conformance suite); STA-1724 FR-021.
 */
import type { ApprovalGate } from "#contracts/ports/approval-gate.port";

/** What a driver gives the suite. */
export interface ApprovalGateHarness {
  /** The gate under test. */
  readonly gate: ApprovalGate;

  /** The pending cap per requester and action the driver enforces. */
  readonly cap: number;

  /** Brings a pending request to `granted`, through the store's own vote. */
  readonly grant: (approvalId: string) => Promise<void>;

  /** Rejects a pending request, through the store's own action; rejects when it is not pending. */
  readonly reject: (approvalId: string) => Promise<void>;

  /** Withdraws a pending request, through the store's own action; rejects when it is not pending. */
  readonly withdraw: (approvalId: string) => Promise<void>;
}
