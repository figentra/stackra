/**
 * Stackra file contract:
 * Purpose: `ClientToolPending`, the client tool call a run is parked on: the model's tool call id, the surface it was
 *          sent to, the tool's key and when the wait ends.
 * Boundary: a type only, stored on the run (`pending_surface_id`, `pending_tool`, `pending_expires_at`) beside the
 *           tool call id it shares with an approval park. It holds no input and no result (ADR 0100 decision 9).
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decision 4); ADR 0100 (decision 9); STA-1631.
 */

/** A parked client tool call. */
export interface ClientToolPending {
  /** The model's tool call id. */
  readonly toolCallId: string;

  /** The surface the call went to. */
  readonly surfaceId: string;

  /** The client tool's key. */
  readonly tool: string;

  /** When the run stops waiting. */
  readonly expiresAt: Date;
}
