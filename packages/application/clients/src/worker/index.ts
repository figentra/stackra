/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./worker` entry of @stackra/clients (`forwardedFacts` and its options, the visitor
 *          facts a Cloudflare Worker forwards to the gateway) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing; a runtime-target entry (the owner's Q4 answer) that imports no
 *           other entry.
 * Runtime: worker
 * Governing contract: ADR 0294 (decision 15); the owner's Q4 answer of 2026-10-24 (runtime-target entries); ADR 0284.
 */
export { forwardedFacts } from "#worker/functions/forwarded-facts.function";
export type { ForwardedFactsOptions } from "#worker/types/forwarded-facts-options.type";
