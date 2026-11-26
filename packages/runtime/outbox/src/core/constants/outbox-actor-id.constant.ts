/**
 * Stackra file contract:
 * Purpose: `OUTBOX_ACTOR_ID`, the id of the outbox relay's system actor: the actor a
 *          claimed row's work runs as, in the row's owner, through `inRowOwner` of @stackra/actions.
 * Boundary: internal; a `sys_` id, never a user's or a tenant's.
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (decisions 1 and 2); ADR 0239 (2026-11-07 amendment, gap A).
 */

/** The outbox relay's system actor id. */
export const OUTBOX_ACTOR_ID = "sys_outbox_relay";
