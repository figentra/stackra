/**
 * Stackra file contract:
 * Purpose: `DevPortIssue`, one dev port failure `checkDevPorts` reports: two owners whose effective ports collide on
 *          some lanes, or a port pushed past 65535 by its lane offset.
 * Boundary: type only.
 * Runtime: isomorphic
 * Governing contract: STA-863 (fail on a duplicate effective dev port, naming both owners), ADR 0296 (decision 1),
 *                     ADR 0231 (snake_case codes).
 */

/** One dev port failure. */
export type DevPortIssue = {
  /** `dev_port_duplicate` (two owners land on one port) or `dev_port_out_of_range` (a lane offset passes 65535). */
  readonly code: "dev_port_duplicate" | "dev_port_out_of_range";
  /** The effective port. */
  readonly port: number;
  /** Each owner, as `<owner> <field>` with its lane (`apps/docs environments.dev.port on lane 7`). */
  readonly owners: readonly string[];
  /** What is wrong, for `stackra validate` to print. */
  readonly message: string;
};
