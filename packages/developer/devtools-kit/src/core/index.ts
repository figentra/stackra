/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/devtools-kit until `stackra gen` writes the entry barrels
 *          (STA-339): the kit, its error, the bus channel and the tab, RPC, stream and host types.
 * Boundary: names each re-export and declares nothing. Isomorphic: no Node import. The buffer size and the name
 *           pattern stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note; ADR 0246.
 */
export { DEVTOOLS_BUS_CHANNEL } from "#core/constants/devtools-bus-channel.constant";
export { DevtoolsError } from "#core/errors/devtools.error";
export { DevtoolsKit } from "#core/services/devtools-kit.service";
export type { DevtoolsAttachment } from "#core/types/devtools-attachment.type";
export type { DevtoolsBusOccurrence } from "#core/types/devtools-bus-occurrence.type";
export type { DevtoolsErrorCode } from "#core/types/devtools-error-code.type";
export type { DevtoolsEvent } from "#core/types/devtools-event.type";
export type { DevtoolsHost } from "#core/types/devtools-host.type";
export type { DevtoolsRemover } from "#core/types/devtools-remover.type";
export type { DevtoolsRpcHandler } from "#core/types/devtools-rpc-handler.type";
export type { DevtoolsSession } from "#core/types/devtools-session.type";
export type { DevtoolsTabDefinition } from "#core/types/devtools-tab-definition.type";
export type { DevtoolsTabMetadata } from "#core/types/devtools-tab-metadata.type";
