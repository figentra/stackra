/**
 * Stackra file contract:
 * Purpose: `usageReportMessage`, the bytes a usage report's signature covers: the UTF-8 of the `canonicalJson` text of
 *          its `UsageReportPayload`.
 * Boundary: pure. The install signs these bytes and the issuing service verifies the same bytes, both through this one
 *           function, so it never changes: a new form is a new payload version.
 * Runtime: isomorphic
 * Governing contract: ADR 0416 (one canonical form for signatures); ADR 0178 (decision 5); OS ADR 0039 d8.
 */
import { canonicalJson } from "@stackra/support";

import type { UsageReportPayload } from "#core/types/usage-report-payload.type";

/**
 * The signed bytes of a usage report.
 *
 * @example
 * await verifySignature(installKey, usageReportMessage(payload), report.signature);
 */
export function usageReportMessage(payload: UsageReportPayload): Uint8Array {
  return new TextEncoder().encode(canonicalJson(payload));
}
