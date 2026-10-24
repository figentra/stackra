/**
 * Stackra file contract:
 * Purpose: `defineWorker`, the one call in a Cloudflare Worker member's `stackra.config.ts`.
 * Boundary: a typed identity function with no runtime effect: gen reads the argument from the syntax tree without
 *           running it.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 1), ADR 0284 (Worker members), ADR 0305 (rule 3), ADR 0127 2026-10-24 note.
 */
import type { WorkerDefinition } from "#core/types/worker-definition.type";

/**
 * Declares a Worker member.
 *
 * @example
 * export default defineWorker({});
 */
export function defineWorker(definition: WorkerDefinition): WorkerDefinition {
  return definition;
}
