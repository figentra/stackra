/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/access-log (the facet, the service, the configuration with its
 *          shape and shipped schema, the memory and outbox sinks, the `AccessRecorded` event, the chain functions, the
 *          refusal and the log event) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `AccessLogConfig` lives in the `src/config/` entry folder; the
 *           driver-name list and the link hash stay internal. Isomorphic: nothing here touches a database or a Node
 *           API, and the hashing is Web Crypto.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { AccessLogConfig } from "#config/access-log.config";
export { ACCESS_LOG_CONFIG_SCHEMA as AccessLogConfig$ } from "#core/constants/access-log-config-schema.constant";
export { ACCESS_LOG_WRITE_FAILED } from "#core/constants/access-log-write-failed.constant";
export { AccessLogged } from "#core/decorators/access-logged.decorator";
export { MemoryAccessLogSinkDriver } from "#core/drivers/memory-access-log-sink.driver";
export { OutboxAccessLogSinkDriver } from "#core/drivers/outbox-access-log-sink.driver";
export { AccessLogWriteFailedError } from "#core/errors/access-log-write-failed.error";
export { AccessRecorded } from "#core/events/access-recorded.event";
export { findChainBreak } from "#core/functions/find-chain-break.function";
export { linkAccessRecord } from "#core/functions/link-access-record.function";
export { AccessLogOptions } from "#core/schemas/access-log-options.schema";
export { AccessLogService } from "#core/services/access-log.service";
