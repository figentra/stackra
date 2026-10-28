/**
 * Stackra file contract:
 * Purpose: `ConsentSnapshotRequest`, what a client sends the consent endpoint to get a `ConsentSnapshot` signed: its
 *          stored decision (or none), whether Global Privacy Control is on, whether the phone refuses tracking, its
 *          region and the subject to bind.
 * Boundary: a type only, in this leaf entry. Built on the client by `ConsentLedger.snapshotRequest()`; the server's
 *           `ConsentSnapshotIssuer` re-applies the ledger's rules to it and never trusts a grant the rules do not give
 *           (an outdated or expired decision grants nothing optional). A native app builds the same from its store.
 * Runtime: isomorphic
 * Governing contract: ADR 0472 (decision 1); ADR 0298 (decisions 1 to 4, 2026-10-29 note).
 */
import type { ConsentRecord } from "#contracts/types/consent-record.type";

/** A request for a signed consent snapshot. */
export interface ConsentSnapshotRequest {
  /** The stored decision as the client holds it, or `null` before a decision. */
  readonly record: ConsentRecord | null;

  /** Whether the browser sends Global Privacy Control. */
  readonly globalPrivacyControl: boolean;

  /** True when the phone refuses tracking (App Tracking Transparency not granted), which refuses `marketing`. */
  readonly appTrackingDenied?: boolean;

  /** The visitor's region code as the ledger knows it, or `null`. */
  readonly region: string | null;

  /** The analytics anonymous id when analytics is granted; absent otherwise (the server picks the subject). */
  readonly subject?: string;
}
