/**
 * Stackra file contract:
 * Purpose: `DEV_LOG_LEVELS`, the levels a dev log entry carries, least severe first, so a tool's `level` option keeps
 *          that level and every level after it.
 * Boundary: data only; mirrors `DevLogEntry["level"]` of @stackra/runway.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); STA-2889.
 */

/** The dev log levels, least severe first. */
export const DEV_LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
