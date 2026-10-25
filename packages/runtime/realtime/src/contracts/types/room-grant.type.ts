/**
 * Stackra file contract:
 * Purpose: `RoomGrant`, what the authenticated room-token endpoint resolved before it asks for a room token: the
 *          verified session, the document whose room it joins, and whether it may publish updates.
 * Boundary: a type only, in the leaf entry. Built by the server: the endpoint checked the document's view permission
 *           at its scope, the visibility rules and the live-collaboration entitlement, and sets `mayEdit` from the
 *           edit permission (ADR 0346 decision 3). The room lives in the session's tenant, never one a client names.
 * Runtime: isomorphic
 * Governing contract: ADR 0346 (decision 3); ADR 0225 (decision 1: IAM authorises each channel).
 */
import type { RealtimeSession } from "#contracts/types/realtime-session.type";

/** A checked right to join one document's room. */
export interface RoomGrant {
  /** The verified caller. */
  readonly session: RealtimeSession;

  /** The public id of the document the room is for (`pag_…`). */
  readonly document: string;

  /** Whether the caller holds the edit permission, so it may publish `update` messages. */
  readonly mayEdit: boolean;
}
