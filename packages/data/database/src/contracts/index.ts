/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/database until `stackra gen` writes the entry barrels
 *          (STA-339): the `VisibilityFilter` port and the `Where` filter type it returns, which a driver package
 *          (the record-visibility filter of @stackra/iam) and a module service import without loading the ORM layer,
 *          and the `HoldRegistry` port with its `Disposal` enum and `HoldLinks` type, which the compliance service
 *          implements, the `HoldChannel` port every other service binds to its client of it, and the
 *          `SequenceTimeZone` port, which the owner of a yearly series implements over its settings, and the
 *          `ConnectionResolver` port with `PRIMARY_CONNECTION` (stackra-310), which a placement driver implements, and
 *          the `QueryObserver` port with its `QuerySample` (stackra-282), which a telemetry driver implements.
 * Boundary: names each re-export and declares nothing. Ports, enums, constants and types only: the `Database` port stays in `.`
 *           because it carries `Database.current()` over the core `ACTIVE_DATABASE` constant. Never imports core.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note; ADR 0333 (decision 4); ADR 0134 (2026-10-24
 *                     amendment); ADR 0394 (decision 1); the STA-347 stand-in barrel decision.
 */
export { PRIMARY_CONNECTION } from "#contracts/constants/primary-connection.constant";
export { Disposal } from "#contracts/enums/disposal.enum";
export { ConnectionResolver } from "#contracts/ports/connection-resolver.port";
export { HoldChannel } from "#contracts/ports/hold-channel.port";
export { HoldRegistry } from "#contracts/ports/hold-registry.port";
export { QueryObserver } from "#contracts/ports/query-observer.port";
export { SequenceTimeZone } from "#contracts/ports/sequence-time-zone.port";
export { VisibilityFilter } from "#contracts/ports/visibility-filter.port";
export type { HoldLinks } from "#contracts/types/hold-links.type";
export type { QuerySample } from "#contracts/types/query-sample.type";
export type { Where } from "#contracts/types/where.type";
