/**
 * Stackra file contract:
 * Purpose: `runwayQueues`, the refusal of a job queue the member's runway does not provision: every queue a service's
 *          job actions name (`jobQueues`, `default` aside) needs an entry under `environments.<env>.queues` of its
 *          `runway.yaml` for each environment the file lists, so a job never runs on a queue without its visibility
 *          timeout and dead-letter queue (`queue_unprovisioned`, STA-1727).
 * Boundary: reads `<root>/runway.yaml` only. A member with no runway file or no environment is not deployed anywhere,
 *           so nothing is refused; `default` is the shared pool, provisioned by the platform. The file is read by
 *           `yamlKeyTree` because gen does not depend on `@stackra/runway`.
 * Runtime: node
 * Governing contract: ADR 0296 (runway v3: a member's runway sizes its own queues); STA-1723 (the queues registry);
 *                     STA-1727.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { StackraManifest } from "@stackra/contracts";

import { DEFAULT_QUEUE } from "#core/constants/default-queue.constant";
import { jobQueues } from "#core/functions/job-queues.function";
import type { GenError } from "#core/types/gen-error.type";
import { yamlKeyTree } from "#node/functions/yaml-key-tree.function";

/** The member's runway file. */
const RUNWAY_FILE = "runway.yaml";

/**
 * The refusals of the job queues `root`'s runway leaves out, one per queue and environment.
 *
 * @example
 * runwayQueues("services/billing", manifest); // [] when every environment lists `billing` under `queues`
 */
export function runwayQueues(root: string, manifest: StackraManifest): GenError[] {
  const file = join(root, RUNWAY_FILE);
  const queues = jobQueues(manifest).filter((queue) => queue !== DEFAULT_QUEUE);
  if (queues.length === 0 || !existsSync(file)) return [];
  const environments = yamlKeyTree(readFileSync(file, "utf8")).get("environments");
  const errors: GenError[] = [];
  for (const [environment, settings] of environments ?? [])
    for (const queue of queues)
      if (settings.get("queues")?.has(queue) !== true)
        errors.push({
          code: "queue_unprovisioned",
          file: RUNWAY_FILE,
          line: 0,
          column: 0,
          subject: `${environment}.${queue}`,
          message: `a job action runs on the queue \`${queue}\`, but ${RUNWAY_FILE} has no \`environments.${environment}.queues.${queue}\`, so ${environment} would not provision it`,
          fix: `add \`${queue}:\` under \`environments.${environment}.queues\` in ${RUNWAY_FILE}, with its \`visibilityTimeoutSeconds\` and \`dlq\``,
        });
  return errors;
}
