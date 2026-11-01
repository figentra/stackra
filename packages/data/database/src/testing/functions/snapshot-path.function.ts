/**
 * Stackra file contract:
 * Purpose: `snapshotPath`, where the snapshot file of a key lives.
 * Boundary: a path only.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); STA-1685.
 */
import { join } from "node:path";

/** The snapshot file of `key` in `directory`. */
export function snapshotPath(directory: string, key: string): string {
  return join(directory, `stackra-pglite-${key}.tar`);
}
