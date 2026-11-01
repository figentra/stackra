/**
 * Stackra file contract:
 * Purpose: `ConsumerGateAllowList`, the allow-list as loaded: its usable entries and the problems found in the rest.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */
import type { ConsumerGateAllowEntry } from "#node/consumer-gate/types/consumer-gate-allow-entry.type";

/** The loaded allow-list. */
export type ConsumerGateAllowList = {
  /** The well-formed entries. */
  readonly entries: readonly ConsumerGateAllowEntry[];

  /** One line per malformed entry; any makes the run RED. */
  readonly problems: readonly string[];

  /** The problems that are a missing or never-allowed `class`: the run is refused (exit 2), not just RED. */
  readonly refused: readonly string[];
};
