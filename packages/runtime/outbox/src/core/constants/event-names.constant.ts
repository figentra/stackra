/**
 * Stackra file contract:
 * Purpose: `EVENT_NAMES`, the integration events this process can write and read, re-exported from @stackra/events,
 *          which owns the registry since STA-1387 so a package below the outbox registers its events without a cycle.
 * Boundary: re-export only; the outbox's writers (`eventName`) and inbox read and write the one process-wide registry
 *           that gen's `registerEventNames` rows fill.
 * Runtime: isomorphic
 * Governing contract: ADR 0141 (2026-10-23 note); ADR 0294 (decisions 20 and 22); STA-1387.
 */
export { EVENT_NAMES } from "@stackra/events";
