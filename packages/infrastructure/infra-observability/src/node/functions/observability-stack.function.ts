/**
 * Stackra file contract:
 * Purpose: `observabilityStack(plan)`, the telemetry part of the Pulumi program `stackra infra gen` composes for the
 *          core stack: the log pipeline when the plan has a telemetry block, the Sentry projects when it has a Sentry
 *          block, the heartbeats, and the public status page when the plan has one. `outputs` mirrors the `ref:` paths the runways name (`otlp.endpoint`,
 *          `betterstack.source`, `sentry.dsn.<member>`), plus the OTLP token and heartbeat URLs as secrets and the
 *          indicators, for the program to export and the stacks repository to copy into each stack's config.
 * Boundary: declares Pulumi resources only. Agents run `pulumi preview` at most; `up` is the owner's.
 * Runtime: node
 * Governing contract: ADR 0184, ADR 0185 (decision 3), ADR 0171 (decisions 3, 4 and 6, as amended by 0289 decision 9),
 *                     ADR 0173.
 *                     STA-1220 (the return type is written out, so the declaration emit names the provider classes
 *                     through the package entry, not their `bin/` files).
 */
import type * as pulumi from "@pulumi/pulumi";

import type { ObservabilityPlan } from "#core/types/observability-plan.type";
import { heartbeatMonitors } from "#node/functions/heartbeat-monitors.function";
import { logPipeline } from "#node/functions/log-pipeline.function";
import { sentryProjects } from "#node/functions/sentry-projects.function";
import { statusPage } from "#node/functions/status-page.function";

/**
 * Every telemetry resource of the plan, and the values the program exports.
 *
 * @param plan - the plan `observabilityPlan` built from the runways.
 * @example
 * // .stackra/infra/index.ts (generated)
 * export const observability = observabilityStack(plan).outputs;
 */
export function observabilityStack(plan: ObservabilityPlan): {
  readonly logs: ReturnType<typeof logPipeline> | undefined;
  readonly sentry: ReturnType<typeof sentryProjects> | undefined;
  readonly heartbeats: ReturnType<typeof heartbeatMonitors>["heartbeats"];
  readonly status: ReturnType<typeof statusPage> | undefined;
  readonly outputs: {
    readonly otlp?: {
      readonly endpoint: pulumi.Output<string>;
      readonly token: pulumi.Output<string>;
    };
    readonly betterstack?: { readonly source: pulumi.Output<pulumi.ID> };
    readonly sentry?: { readonly dsn: ReturnType<typeof sentryProjects>["dsn"] };
    readonly heartbeats: ReturnType<typeof heartbeatMonitors>["urls"];
    readonly statusPage?: { readonly id: pulumi.Output<pulumi.ID> };
    readonly slis: ObservabilityPlan["slis"];
  };
} {
  const logs =
    plan.telemetry === null ? undefined : logPipeline({ project: plan.project, ...plan.telemetry });
  const sentry =
    plan.sentry === null
      ? undefined
      : sentryProjects({
          team: plan.project,
          sentry: plan.sentry,
          environments: plan.environments,
        });
  const heartbeats = heartbeatMonitors({ project: plan.project, heartbeats: plan.heartbeats });
  const status =
    plan.statusPage === null
      ? undefined
      : statusPage({
          project: plan.project,
          page: plan.statusPage,
          heartbeats: plan.heartbeats,
          monitors: heartbeats.heartbeats,
        });
  return {
    logs,
    sentry,
    heartbeats: heartbeats.heartbeats,
    status,
    outputs: {
      ...(logs === undefined
        ? {}
        : {
            otlp: { endpoint: logs.endpoint, token: logs.token },
            betterstack: { source: logs.source.id },
          }),
      ...(sentry === undefined ? {} : { sentry: { dsn: sentry.dsn } }),
      heartbeats: heartbeats.urls,
      ...(status === undefined ? {} : { statusPage: { id: status.statusPage.id } }),
      slis: plan.slis,
    },
  };
}
