/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/realtime (the `RealtimeDriver` and `RealtimeTransport`
 *          ports and the types they speak) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package
 *           (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { RealtimeDriver } from "#contracts/ports/realtime-driver.port";
export { RealtimeTransport } from "#contracts/ports/realtime-transport.port";
export type { RealtimeBroadcast } from "#contracts/types/realtime-broadcast.type";
export type { RealtimeLink } from "#contracts/types/realtime-link.type";
export type { RealtimeLinkHandlers } from "#contracts/types/realtime-link-handlers.type";
export type { RealtimeMessage } from "#contracts/types/realtime-message.type";
export type { RealtimeSession } from "#contracts/types/realtime-session.type";
export type { RealtimeTarget } from "#contracts/types/realtime-target.type";
