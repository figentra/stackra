/**
 * Stackra file contract:
 * Purpose: `checkQueueSettings`, the warning `queue_dlq_unsupported`: an environment of a service's runway sets
 *          `dlq: false` on a queue its job actions run on, but the queue rides an Encore Pub/Sub subscription, and
 *          Encore always moves a message to the subscription's dead-letter queue once its retries run out (a TypeScript
 *          subscription cannot ask for unlimited retries), so the setting cannot apply (STA-2050). One warning per
 *          queue and environment.
 * Boundary: pure; warnings only, never a refusal, so gen still writes: the setting is valid runway and other queue
 *           drivers (Postgres on-prem) may honour it. A queue no job action names is not checked.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 3 and 6: Encore Pub/Sub queues in SaaS); ADR 0296 (runway v3); STA-2050.
 */
import type { StackraManifest } from "@stackra/contracts";

import { jobQueues } from "#core/functions/job-queues.function";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** The member's runway file. */
const RUNWAY_FILE = "runway.yaml";

/**
 * The `queue_dlq_unsupported` warnings of `ir`.
 *
 * @example
 * checkQueueSettings(ir, manifest); // [{ code: "queue_dlq_unsupported", subject: "staging.billing", severity: "warning", ... }]
 */
export function checkQueueSettings(ir: MemberIR, manifest: StackraManifest): GenError[] {
  if (ir.layout !== "service") return [];
  const queues = new Set(jobQueues(manifest));
  const warnings: GenError[] = [];
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  for (const [environment, settings] of Object.entries(ir.queueSettings ?? {}).sort(
    ([left], [right]) => left.localeCompare(right),
  ))
    for (const [queue, { dlq }] of Object.entries(settings))
      if (dlq === false && queues.has(queue))
        warnings.push({
          code: "queue_dlq_unsupported",
          file: RUNWAY_FILE,
          line: 0,
          column: 0,
          subject: `${environment}.${queue}`,
          message: `\`environments.${environment}.queues.${queue}.dlq\` is false, but the queue rides an Encore Pub/Sub subscription, which always dead-letters a message once its retries run out`,
          fix: `remove \`dlq: false\` from \`environments.${environment}.queues.${queue}\` in ${RUNWAY_FILE}; the job's own dead letters stay in queue.jobs either way`,
          severity: "warning",
        });
  return warnings;
}
