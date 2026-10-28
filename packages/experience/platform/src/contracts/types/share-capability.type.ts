/**
 * Stackra file contract:
 * Purpose: `ShareCapability`, the `share` facet: opens the system share sheet with the given data.
 * Boundary: a type only. A user who closes the sheet is not a refusal: it resolves `{ ok: true, data: false }`.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decisions 2 and 3).
 */
import type { CapabilityResult } from "#contracts/types/capability-result.type";
import type { ShareData } from "#contracts/types/share-data.type";

/** The system share sheet. */
export interface ShareCapability {
  /** Shares `data`; `data` is true when the user completed the share, false when they closed the sheet. */
  share: (data: ShareData) => Promise<CapabilityResult<boolean>>;
}
