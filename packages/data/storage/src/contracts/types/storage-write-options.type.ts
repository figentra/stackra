/**
 * Stackra file contract:
 * Purpose: `StorageWriteOptions`, what a write to a storage area may add: how long the value lives.
 * Boundary: a type only. A value written without a time-to-live lives until it is deleted or its area is cleared.
 * Runtime: isomorphic
 * Governing contract: ADR 0256 (decision 4: a time-to-live per store), ADR 0294 (decision 8: no anonymous object type
 *                     in an exported signature).
 */
import type { Duration } from "@stackra/contracts";

/** The options of a write. */
export interface StorageWriteOptions {
  /** How long the value lives from now; once it has passed, the key reads as absent. */
  readonly ttl?: Duration;
}
