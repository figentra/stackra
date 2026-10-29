/**
 * Stackra file contract:
 * Purpose: `IssueConsentSnapshotInput`, the input of `consent.consent_snapshot.issue@1`: a `ConsentSnapshotRequest`
 *          (the stored decision or `null`, Global Privacy Control, the phone's tracking refusal, the region and the
 *          analytics anonymous id).
 * Boundary: a shape class in schemas/, one declaration per file; it registers its zod schema when the module loads
 *           (STA-339 replaces the registration). The record is checked with the stored decision's schema; nothing in it
 *           is trusted: `ConsentSnapshotIssuer` re-applies the ledger's rules.
 * Runtime: isomorphic
 * Governing contract: ADR 0472 (decision 1); ADR 0294 (decisions 4 and 26); ADR 0305 (Input in its own file).
 */
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import type { ConsentRecord } from "#contracts/types/consent-record.type";
import { CONSENT_RECORD_SCHEMA } from "#core/constants/consent-record-schema.constant";

/** A client's request for a signed consent snapshot. */
export class IssueConsentSnapshotInput extends Schema {
  /** The stored decision as the client holds it, or `null` before a decision. */
  record!: ConsentRecord | null;

  /** Whether the browser sends Global Privacy Control. */
  globalPrivacyControl!: boolean;

  /** True when the phone refuses tracking, which refuses `marketing`. */
  appTrackingDenied?: boolean;

  /** The visitor's region code, or `null`. */
  region!: string | null;

  /** The analytics anonymous id, bound as the subject when analytics is granted. */
  subject?: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    IssueConsentSnapshotInput,
    z.object({
      record: CONSENT_RECORD_SCHEMA.nullable(),
      globalPrivacyControl: z.boolean(),
      appTrackingDenied: z.boolean().optional(),
      region: z.string().min(1).max(16).nullable(),
      subject: z.string().min(1).max(128).optional(),
    }),
  ],
]);
