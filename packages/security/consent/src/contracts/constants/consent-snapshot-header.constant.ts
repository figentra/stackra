/**
 * Stackra file contract:
 * Purpose: `CONSENT_SNAPSHOT_HEADER`, the request header a client sends its signed consent snapshot in
 *          (`Stackra-Consent`, ADR 0472 decision 3).
 * Boundary: a constant, in this leaf entry, so the client (`consentSnapshotHeaders`) and the server transport (a
 *           generated endpoint's `requestCallOptions`, the ingest Worker) name the same header. It is
 *           `CALL_HEADERS.consentSnapshot` of @stackra/actions, spelled once there. The transport passes the value as
 *           sent to the action pipeline (`CallOptions.consentSnapshot`); it never trusts it.
 * Runtime: isomorphic
 * Governing contract: ADR 0472 (decision 3).
 */
import { CALL_HEADERS } from "@stackra/actions/contracts";

/**
 * The consent snapshot header.
 *
 * @example
 * headers.set(CONSENT_SNAPSHOT_HEADER, token);
 */
export const CONSENT_SNAPSHOT_HEADER = CALL_HEADERS.consentSnapshot;
