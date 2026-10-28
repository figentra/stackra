/**
 * Stackra file contract:
 * Purpose: `DevtoolsTabDefinition`, what a package's devtools entry hands `kit.defineTab`: the tab's metadata and the
 *          function that reads its data when a host opens it.
 * Boundary: a type only. The data is read on demand, never pushed; a tab that changes often also emits on a channel.
 * Runtime: isomorphic
 * Governing contract: ADR 0246 (decision 4).
 */
import type { DevtoolsTabMetadata } from "#core/types/devtools-tab-metadata.type";

/** A data tab. */
export interface DevtoolsTabDefinition extends DevtoolsTabMetadata {
  /** Reads the tab's current data; a host receives what it returns (or resolves to). */
  read: () => unknown;
}
