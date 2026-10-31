/**
 * Stackra file contract:
 * Purpose: `emitQueues`, a member's typed queue registry (`.stackra/gen/queues.ts`, imported as `#stackra/queues`):
 *          `Queues`, built with `queues()` of `@stackra/queue` over the queues its job actions run on and `default`, so
 *          a job or a dispatch writes `Queues.Billing` and a queue no job names any more is a type error.
 * Boundary: pure; written only for a service with a job action, its hosted packages' job queues included (a service
 *           with a job already depends on `@stackra/queue`; a package's jobs run on its host's queues).
 *           The source reader reads `Queues.<Name>` as the snake_case name by syntax, so a job's own options use the
 *           registry before this file exists (STA-1723).
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 1 and 3); ADR 0294 (decision 20: generated registries); STA-1723.
 */
import type { StackraManifest } from "@stackra/contracts";

import { generatedHeader } from "#core/functions/generated-header.function";
import { DEFAULT_QUEUE } from "#core/constants/default-queue.constant";
import { jobQueues } from "#core/functions/job-queues.function";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The queue registry of a service, or undefined for any other member or a service with no job action.
 *
 * @example
 * emitQueues(ir, manifest); // '…export const Queues = queues(["billing", "default"] as const);…'
 */
export function emitQueues(ir: MemberIR, manifest: StackraManifest): string | undefined {
  if (ir.layout !== "service") return undefined;
  const used = jobQueues(manifest);
  if (used.length === 0) return undefined;
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  const names = [...new Set([...used, DEFAULT_QUEUE])].sort();
  return [
    generatedHeader({
      from: "stackra.manifest.json (the job actions and their queues)",
      purpose: `the queues of ${ir.package}'s jobs, and \`default\`: \`Queues.<Name>\` is the snake_case queue name.`,
      boundary:
        "a queue no job names any more drops out, so every reference to it fails to compile; a queue whose name " +
        "has a part starting with a digit cannot be written as `Queues.<Name>` and keeps its string.",
      runtime: "isomorphic",
    }),
    'import { queues } from "@stackra/queue";',
    "",
    `/** The queues of ${ir.package}'s jobs. */`,
    `export const Queues = queues([${names.map((name) => JSON.stringify(name)).join(", ")}] as const);`,
    "",
  ].join("\n");
}
