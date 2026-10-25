/**
 * Stackra file contract:
 * Purpose: `WorkerDefinition`, what a Cloudflare Worker member's `stackra.config.ts` passes to `defineWorker`.
 * Boundary: a type only; static data. The member key comes from the package name.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decisions 1 and 5), ADR 0284 (Worker members).
 */

/** The definition of a Worker member. */
// shortcut: open sections until gen writes the Workers config from this file and ships its shape (STA-339); today
// `wrangler.jsonc` is hand-written beside it.
export type WorkerDefinition = { readonly [section: string]: unknown };
