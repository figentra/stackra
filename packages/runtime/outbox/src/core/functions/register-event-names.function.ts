/**
 * Stackra file contract:
 * Purpose: `registerEventNames`, re-exported from @stackra/events, which owns it since STA-1387: gen's generated entry
 *          imports it from there, so a package below the outbox (@stackra/actions) registers its integration events'
 *          wire names without a package cycle. Kept on the outbox's `.` entry for existing callers.
 * Boundary: re-export only; the function and its checks live in @stackra/events.
 * Runtime: isomorphic
 * Governing contract: ADR 0141 (2026-10-23 note); ADR 0294 (decisions 10, 20 and 22); STA-1387.
 */
export { registerEventNames } from "@stackra/events";
