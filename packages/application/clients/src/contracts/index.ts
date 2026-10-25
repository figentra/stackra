/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/clients (the `ClientTransport` and `ClientSession`
 *          ports, the `ClientRequest` a transport receives, the `TransportFailure` reasons and the `DEVICE_ORDER` wire
 *          names) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package
 *           (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { DEVICE_ORDER } from "#contracts/constants/device-order.constant";
export { TransportFailure } from "#contracts/enums/transport-failure.enum";
export { ClientSession } from "#contracts/ports/client-session.port";
export { ClientTransport } from "#contracts/ports/client-transport.port";
export type { ClientRequest } from "#contracts/types/client-request.type";
