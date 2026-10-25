/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/logger, the `LogReporter` port with the `LogLevel` and
 *          `LogRecord` its signature needs, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports only @stackra/contracts, never `core`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { LogLevel } from "#contracts/enums/log-level.enum";
export { LogReporter } from "#contracts/ports/log-reporter.port";
export type { LogRecord } from "#contracts/types/log-record.type";
