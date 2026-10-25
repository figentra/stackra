/**
 * Stackra file contract:
 * Purpose: `RoomMessageKind`, the three payload kinds a room carries: `presence` (who is here, with a state),
 *          `awareness` (cursor and selection) and `update` (a CRDT update, base64 on the wire).
 * Boundary: a type only, in the leaf entry. Only `update` needs the edit grant; a viewer sends presence and awareness.
 * Runtime: isomorphic
 * Governing contract: ADR 0346 (decision 4).
 */

/** What a room message carries. */
export type RoomMessageKind = "presence" | "awareness" | "update";
