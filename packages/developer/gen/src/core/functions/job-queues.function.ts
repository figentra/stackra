/**
 * Stackra file contract:
 * Purpose: `jobQueues`, the queues a member's job actions run on, read from its manifest (the hosted packages' job
 *          actions included for a service): each job action's `queue`, or `default` for one that names none.
 * Boundary: pure; sorted and without repeats. Shared by the broker queue file and the `#stackra/queues` registry.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 1 and 3); STA-1723.
 */
import type { StackraManifest } from "@stackra/contracts";

import { DEFAULT_QUEUE } from "#core/constants/default-queue.constant";

/**
 * The sorted queues of the manifest's job actions.
 *
 * @example
 * jobQueues(manifest); // ["billing", "default"]
 */
export function jobQueues(manifest: StackraManifest): string[] {
  const queues = new Set<string>();
  for (const entry of (manifest.actions ?? []) as readonly Readonly<Record<string, unknown>>[]) {
    const job = entry["job"] as { readonly queue?: unknown } | undefined;
    if (entry["kind"] === "action" && job !== undefined)
      queues.add(typeof job.queue === "string" ? job.queue : DEFAULT_QUEUE);
  }
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  return [...queues].sort();
}
