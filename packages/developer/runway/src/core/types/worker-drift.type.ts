/**
 * Stackra file contract:
 * Purpose: `WorkerDrift`, one Worker member's differences; `rows` is empty when the Worker matches.
 * Boundary: plain data.
 * Runtime: isomorphic
 * Governing contract: ADR 0519 (decision 7); STA-1992.
 */
import type { DriftRow } from "#core/types/drift-row.type";

/** One Worker member's settings that differ from what Cloudflare reports. */
export type WorkerDrift = {
  /** The Worker member's key in the runway. */
  readonly member: string;
  /** The Worker's name on Cloudflare. */
  readonly worker: string;
  /** The differing settings, empty when the Worker matches. */
  readonly rows: readonly DriftRow[];
};
