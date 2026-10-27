/**
 * Stackra file contract:
 * Purpose: `SignedUsageReport`, the file an on-prem install exports for its operator to upload: the payload's fields
 *          and the install key's detached signature over them.
 * Boundary: a type only, plain JSON (the operator moves it by hand on an air-gapped install). The fields are flat, as
 *           the OS import input reads them; the importer rebuilds the payload from them, so any edit after signing
 *           fails verification.
 * Runtime: isomorphic
 * Governing contract: ADR 0178 (decision 5); ADR 0416; OS ADR 0039 d8.
 */
import type { Signature } from "@stackra/contracts";

import type { UsageReportPayload } from "#core/types/usage-report-payload.type";

/** One exported, signed usage report. */
export interface SignedUsageReport extends UsageReportPayload {
  /** The install key's ES256 signature of `usageReportMessage(payload)`. */
  readonly signature: Signature;
}
