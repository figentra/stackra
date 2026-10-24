/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./server` entry of @stackra/clients (`createPublicClients`, `RetryOn` and their types,
 *          for a Worker's or a server render's anonymous calls to the public area) until `stackra gen` writes the
 *          entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing; a runtime-target entry (the owner's Q4 answer) that imports
 *           `core`, never another entry.
 * Runtime: worker, node
 * Governing contract: ADR 0294 (decision 15); the owner's Q4 answer of 2026-10-24 (runtime-target entries).
 */
export { RetryOn } from "#server/enums/retry-on.enum";
export { createPublicClients } from "#server/functions/create-public-clients.function";
export type { PublicClients } from "#server/types/public-clients.type";
export type { PublicClientsOptions } from "#server/types/public-clients-options.type";
