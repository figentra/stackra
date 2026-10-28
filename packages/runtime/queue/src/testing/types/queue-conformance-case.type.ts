/**
 * Stackra file contract:
 * Purpose: `QueueConformanceCase`, one rule of the `QueueDriver` port as a runnable case of the conformance suite.
 * Boundary: a type only, in the `./testing` entry. A case runs on a fresh, empty driver and returns the rules missed
 *           instead of throwing.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 1 and 2); ADR 0142 (every driver passes its port's suite); ADR 0269.
 */
import type { QueueDriver } from "#contracts/index";

/** One runnable rule. */
export interface QueueConformanceCase {
  /** Stable id, `queue.<rule>`. */
  readonly id: string;

  /** Runs the rule on an empty `driver` and returns what it missed. */
  readonly run: (driver: QueueDriver) => Promise<string[]>;
}
