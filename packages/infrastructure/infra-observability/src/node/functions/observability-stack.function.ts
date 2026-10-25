/**
 * Stackra file contract:
 * Purpose: `observabilityStack(plan)`, the telemetry part of the Pulumi program `stackra infra gen` composes for the
 *          core stack: the log pipeline when the plan has a telemetry block, the Sentry projects when it has a Sentry
 *          block, and the heartbeats. `outputs` mirrors the `ref:` paths the runways name (`otlp.endpoint`,
 *          `betterstack.source`, `sentry.dsn.<member>`), plus the OTLP token and heartbeat URLs as secrets and the
 *          indicators, for the program to export and the stacks repository to copy into each stack's config.
 * Boundary: declares Pulumi resources only. Agents run `pulumi preview` at most; `up` is the owner's.
 * Runtime: node (Pulumi program)
 * Governing contract: ADR 0184, ADR 0171 (decisions 3, 4 and 6, as amended by 0289 decision 9), ADR 0173.
 */
import type { ObservabilityPlan } from "#core/types/observability-plan.type";
import { heartbeatMonitors } from "#node/functions/heartbeat-monitors.function";
import { logPipeline } from "#node/functions/log-pipeline.function";
import { sentryProjects } from "#node/functions/sentry-projects.function";

/**
 * Every telemetry resource of the plan, and the values the program exports.
 *
 * @param plan - the plan `observabilityPlan` built from the runways.
 * @example
 * // .stackra/infra/index.ts (generated)
 * export const observability = observabilityStack(plan).outputs;
 */
export function observabilityStack(plan: ObservabilityPlan) {
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
  return {
    logs,
    sentry,
    heartbeats: heartbeats.heartbeats,
    outputs: {
      ...(logs === undefined
        ? {}
        : {
            otlp: { endpoint: logs.endpoint, token: logs.token },
            betterstack: { source: logs.source.id },
          }),
      ...(sentry === undefined ? {} : { sentry: { dsn: sentry.dsn } }),
      heartbeats: heartbeats.urls,
      slis: plan.slis,
    },
  };
}
