/**
 * Stackra file contract:
 * Purpose: `PortIssue`, one dev port failure `checkPorts` reports: a snake_case code, the effective port, the owners
 *          that claim it (both, for a duplicate) and a message.
 * Boundary: type only.
 * Runtime: isomorphic
 * Governing contract: STA-863 (duplicate effective dev ports fail naming both owners), ADR 0231 (snake_case codes).
 */

/** One dev port failure. */
export type PortIssue = {
  /** `duplicate_port` (two owners land on one effective port) or `port_out_of_range` (a lane pushes it past 65535). */
  readonly code: "duplicate_port" | "port_out_of_range";
  /** The effective port. */
  readonly port: number;
  /** Who claims it, `<repo> worktree <n> (lane <l>) <source>`: the first claimant, then the second for a duplicate. */
  readonly owners: readonly string[];
  /** What is wrong, for `stackra validate` to print. */
  readonly message: string;
};
