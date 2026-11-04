/**
 * Stackra file contract:
 * Purpose: `WorkerDrift`, one Worker member's differences; `rows` is empty when the Worker matches.
 * Boundary: plain data.
 * Runtime: isomorphic
 * Governing contract: ADR 0519 (decision 7); STA-1992.
 */
import type { DriftRow } from "#core/types/drift-row.type";

export type WorkerDrift = {
  readonly member: string;
  /** The Worker's name on Cloudflare. */
  readonly worker: string;
  readonly rows: readonly DriftRow[];
};
