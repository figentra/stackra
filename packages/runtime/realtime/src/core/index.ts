/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/realtime (the configuration with its shipped schema, the status,
 *          the server hub and broadcaster, the client connection, and the drivers of both ports) until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The shipped schema is re-exported under the generated name
 *           (`RealtimeConfig$`) a host's generated schemas extend. The ports are the `./contracts` entry's and are not
 *           re-exported here (one symbol, one entry). Every driver ships from here: they use web-standard APIs only,
 *           so no runtime-target entry is needed. The two driver-name types carry the `DriverRegistry` augmentation,
 *           so exporting them loads it for every consumer.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { RealtimeConfig } from "#config/realtime.config";
export { REALTIME_CONFIG_SCHEMA as RealtimeConfig$ } from "#core/constants/realtime-config-schema.constant";
export { REALTIME_PATH } from "#core/constants/realtime-path.constant";
export { MemoryRealtimeDriver } from "#core/drivers/memory-realtime.driver";
export { MemoryRealtimeTransportDriver } from "#core/drivers/memory-realtime-transport.driver";
export { SseRealtimeDriver } from "#core/drivers/sse-realtime.driver";
export { WebSocketRealtimeDriver } from "#core/drivers/web-socket-realtime.driver";
export { WebsocketRealtimeTransportDriver } from "#core/drivers/websocket-realtime-transport.driver";
export { RealtimeStatus } from "#core/enums/realtime-status.enum";
export { RealtimeOptions } from "#core/schemas/realtime-options.schema";
export { RealtimeBroadcaster } from "#core/services/realtime-broadcaster.service";
export { RealtimeConnection } from "#core/services/realtime-connection.service";
export { RealtimeHub } from "#core/services/realtime-hub.service";
export type { BroadcastRoute } from "#core/types/broadcast-route.type";
export type { RealtimeConnectionState } from "#core/types/realtime-connection-state.type";
export type { RealtimeDriverName } from "#core/types/realtime-driver-name.type";
export type { RealtimeEventRef } from "#core/types/realtime-event-ref.type";
export type { RealtimePeer } from "#core/types/realtime-peer.type";
export type { RealtimeSocket } from "#core/types/realtime-socket.type";
export type { RealtimeToken } from "#core/types/realtime-token.type";
export type { RealtimeTransportName } from "#core/types/realtime-transport-name.type";
