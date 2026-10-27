/**
 * Stackra file contract:
 * Purpose: `emitEncoreCronJobs`, a service's Encore CronJobs (`.stackra/encore/<member>/cron.ts`): the rows
 *          `encoreCronJobs()` of @stackra/scheduler gives at run time, written statically as Encore requires: one
 *          CronJob per action whose `job` has a `cron` (its own schedule, its endpoint calling `SchedulerService.fire`
 *          with the locked key) and one every minute that ticks the stored per-scope schedules
 *          (`tick(undefined, { crons: false })`).
 * Boundary: pure; reads the manifest's actions, the hosted packages' included. Written only for a service that has a
 *           cron action or runs `@stackra/scheduler`. Each endpoint is internal (`expose: false`) and reaches the
 *           member through `app.handlers.run`, so a drain waits for it. Encore runs one invocation of a CronJob at a
 *           time, so `fire` takes no lock. This is the one place outside the Encore target that names `encore.dev`.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 4 and 6); ADR 0266 (decision 4.6: the Encore CronJob in SaaS); ADR 0091 and
 *                     0124 (Encore is generated); ADR 0295 (decision 8: the adapters reach the member through
 *                     `handlers`).
 */
import type { StackraManifest } from "@stackra/contracts";
import { camelCase } from "@stackra/support";

import { ENCORE_APP_IMPORT } from "#core/constants/encore-app-import.constant";
import { cronJobId } from "#core/functions/cron-job-id.function";
import { generatedHeader } from "#core/functions/generated-header.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** The id of the stored schedules' minute tick, as `encoreCronJobs()` names it. */
const SCHEDULES = "scheduler-schedules";

/** The cron actions of a manifest: locked key and schedule, in manifest order. */
function cronActions(manifest: StackraManifest): { key: string; schedule: string }[] {
  const out: { key: string; schedule: string }[] = [];
  for (const entry of (manifest.actions ?? []) as readonly Readonly<Record<string, unknown>>[]) {
    const job = entry["job"] as { readonly cron?: { readonly schedule?: unknown } } | undefined;
    const schedule = job?.cron?.schedule;
    if (entry["kind"] === "action" && typeof schedule === "string")
      out.push({ key: String(entry["key"]), schedule });
  }
  return out;
}

/**
 * The CronJobs file of a service, or undefined when it schedules nothing.
 *
 * @example
 * emitEncoreCronJobs(ir, manifest)?.path; // ".stackra/encore/billing/cron.ts"
 */
export function emitEncoreCronJobs(
  ir: MemberIR,
  manifest: StackraManifest,
): GeneratedFile | undefined {
  if (ir.layout !== "service") return undefined;
  const crons = cronActions(manifest);
  const scheduler =
    (ir.packages ?? []).includes("@stackra/scheduler") ||
    ir.dependencies.some((dependency) => dependency.package === "@stackra/scheduler");
  if (crons.length === 0 && !scheduler) return undefined;

  const jobs = [
    ...crons.map(({ key, schedule }) => ({
      id: cronJobId(key),
      title: key,
      schedule,
      call: `container.get(SchedulerService).fire(${JSON.stringify(key)})`,
    })),
    {
      id: SCHEDULES,
      title: "Stored per-scope schedules",
      schedule: "* * * * *",
      call: "container.get(SchedulerService).tick(undefined, { crons: false })",
    },
  ];
  const body = jobs.flatMap(({ id, title, schedule, call }) => {
    const endpoint = camelCase(id.replace(/-/g, "_"));
    return [
      `/** Runs ${title} on its schedule. */`,
      `export const ${endpoint} = api({ expose: false }, async (): Promise<void> => {`,
      `  await app.handlers.run(async (container) => {`,
      `    await ${call};`,
      "  });",
      "});",
      "",
      `export const ${endpoint}Job = new CronJob(${JSON.stringify(id)}, {`,
      `  title: ${JSON.stringify(title)},`,
      `  schedule: ${JSON.stringify(schedule)},`,
      `  endpoint: ${endpoint},`,
      "});",
      "",
    ];
  });
  const header = generatedHeader({
    from: "stackra.manifest.json (the actions whose job has a cron)",
    purpose: `the Encore CronJobs of ${ir.package}: one per cron action and the stored schedules' minute tick.`,
    boundary:
      "every endpoint is internal and runs through the server app's handlers; the schedules are UTC, as the cron " +
      "option writes them.",
    runtime: "node",
  });
  return {
    path: `.stackra/encore/${ir.member}/cron.ts`,
    content: [
      header,
      'import { SchedulerService } from "@stackra/scheduler";',
      'import { api } from "encore.dev/api";',
      'import { CronJob } from "encore.dev/cron";',
      "",
      ENCORE_APP_IMPORT,
      "",
      ...body,
    ]
      .join("\n")
      .replace(/\n+$/, "\n"),
  };
}
