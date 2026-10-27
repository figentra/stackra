/**
 * Stackra file contract:
 * Purpose: `emitEncoreQueues`, a service's broker-delivered queues (`.stackra/encore/<member>/queues.ts`): one Encore
 *          Pub/Sub `Topic` per queue its job actions name, registered with `registerBrokerTopics` as `queue.<name>`
 *          so a broker-delivered queue driver publishes each job to it, and one `Subscription` per topic that runs each
 *          delivered job through `QueueWorkerService.process` in the server app.
 * Boundary: pure; reads the manifest's job actions, the hosted packages' included; a job without a queue runs on
 *           `default`, the queue package's default. Written only for a service with a job action. Topic and
 *           subscription names carry the member key, so two services' `default` queues never share a topic. Delivery
 *           is at least once: the worker's Idempotency-Key per job makes a repeat replay. The message body is the
 *           queued job as JSON; its `runAt` is read back into a date. Which driver publishes is runtime
 *           configuration; the topics cost nothing while no driver uses them.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 1, 3 and 6: Encore Pub/Sub in SaaS); ADR 0266 (decision 4.3:
 *                     encore-pubsub); ADR 0136 (decision 3: jobs derive their Idempotency-Keys); ADR 0091 and 0124.
 */
import type { StackraManifest } from "@stackra/contracts";
import { camelCase, kebabCase } from "@stackra/support";

import { ENCORE_APP_IMPORT } from "#core/constants/encore-app-import.constant";
import { generatedHeader } from "#core/functions/generated-header.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** The queue a job runs on when its action names none (`JOB_DEFAULTS.queue` of @stackra/queue). */
const DEFAULT_QUEUE = "default";

/**
 * The broker queue file of a service, or undefined when it has no job action.
 *
 * @example
 * emitEncoreQueues(ir, manifest)?.path; // ".stackra/encore/billing/queues.ts"
 */
export function emitEncoreQueues(
  ir: MemberIR,
  manifest: StackraManifest,
): GeneratedFile | undefined {
  if (ir.layout !== "service") return undefined;
  const queues = new Set<string>();
  for (const entry of (manifest.actions ?? []) as readonly Readonly<Record<string, unknown>>[]) {
    const job = entry["job"] as { readonly queue?: unknown } | undefined;
    if (entry["kind"] === "action" && job !== undefined)
      queues.add(typeof job.queue === "string" ? job.queue : DEFAULT_QUEUE);
  }
  if (queues.size === 0) return undefined;

  const rows = [...queues].sort().map((queue) => {
    const name = `${kebabCase(ir.member)}-queue-${kebabCase(queue)}`;
    return { queue, name, topic: camelCase(`queue_${queue.replace(/[^A-Za-z0-9]+/g, "_")}`) };
  });
  const header = generatedHeader({
    from: "stackra.manifest.json (the job actions and their queues)",
    purpose: `the broker-delivered queues of ${ir.package}: one Pub/Sub topic and subscription per queue.`,
    boundary:
      "a delivered job runs through the server app's handlers and the queue worker, so the action pipeline, the " +
      "job actor and the job's Idempotency-Key apply as for a stored job.",
    runtime: "node",
  });
  return {
    path: `.stackra/encore/${ir.member}/queues.ts`,
    content: [
      header,
      'import { registerBrokerTopics } from "@stackra/queue";',
      'import type { BrokerMessage, QueuedJob } from "@stackra/queue/contracts";',
      'import { QueueWorkerService } from "@stackra/queue/node";',
      'import { Subscription, Topic } from "encore.dev/pubsub";',
      "",
      ENCORE_APP_IMPORT,
      "",
      "/** The queued job a message carries, with its run time read back into a date. */",
      "function jobOf(message: BrokerMessage): QueuedJob {",
      "  const job = message.body as QueuedJob & { readonly runAt: string | Date };",
      "  return { ...job, runAt: new Date(job.runAt) };",
      "}",
      "",
      ...rows.flatMap(({ queue, name, topic }) => [
        `/** The jobs of the \`${queue}\` queue. */`,
        `export const ${topic} = new Topic<BrokerMessage>(${JSON.stringify(name)}, {`,
        '  deliveryGuarantee: "at-least-once",',
        "});",
        "",
        `/** Runs each delivered job of \`${queue}\` through the worker. */`,
        `export const ${topic}Subscription = new Subscription(${topic}, ${JSON.stringify(name)}, {`,
        "  handler: (message) =>",
        "    app.handlers.run(async (container) => {",
        "      await container.get(QueueWorkerService).process(jobOf(message));",
        "    }),",
        "});",
        "",
      ]),
      "registerBrokerTopics([",
      ...rows.map(
        ({ queue, topic }) => `  { name: ${JSON.stringify(`queue.${queue}`)}, topic: ${topic} },`,
      ),
      "]);",
      "",
    ].join("\n"),
  };
}
