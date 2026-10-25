/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./worker` runtime-target entry of @stackra/app (the Cloudflare Worker `createApp`
 *          and its request types), until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` through `#core/*`; `.` never imports it.
 * Runtime: worker
 * Governing contract: ADR 0295 (decision 8); ADR 0127 2026-10-24 note (runtime-target entries).
 */
export { createApp } from "#worker/functions/create-app.function";
export type { WorkerApp } from "#worker/types/worker-app.type";
export type { WorkerAppOptions } from "#worker/types/worker-app-options.type";
export type { WorkerExecutionContext } from "#worker/types/worker-execution-context.type";
export type { WorkerRequest } from "#worker/types/worker-request.type";
