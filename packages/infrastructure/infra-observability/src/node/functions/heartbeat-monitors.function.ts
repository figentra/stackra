/**
 * Stackra file contract:
 * Purpose: `heartbeatMonitors(args)`, one Better Stack heartbeat per planned heartbeat (ADR 0184 decision 4): it
 *          expects a beat every `periodSeconds`, tolerates `graceSeconds`, and on a miss opens an incident that mails
 *          and pushes to whoever is on call (ADR 0185 decision 1). Returns each heartbeat's URL as a secret output,
 *          keyed by environment, service and job name, for runway to hand to the service as a secret.
 * Boundary: declares Pulumi resources only. The URL is the credential that beats, so it is a secret output and is
 *           never printed. Sending the beat is the job's (`@stackra/scheduler`, `@stackra/outbox`, `@stackra/queue`).
 *           The provider's API token (`better-uptime:apiToken`) is the owner's stack config.
 * Runtime: node (Pulumi program)
 * Governing contract: ADR 0184 (decision 4), ADR 0185 (decision 1: Better Stack runs on-call), ADR 0173.
 */
import * as pulumi from "@pulumi/pulumi";
import * as betterstack from "pulumi-better-uptime";

import type { ObservabilityPlan } from "#core/types/observability-plan.type";

/**
 * The heartbeats and their URLs.
 *
 * @param args - the project (prefixes each name) and the plan's heartbeats.
 * @example
 * const { urls } = heartbeatMonitors({ project: "acme-platform", heartbeats: plan.heartbeats });
 * urls.production?.commerce?.["nightly-export"]; // secret Output<string>
 */
export function heartbeatMonitors(args: {
  readonly project: string;
  readonly heartbeats: ObservabilityPlan["heartbeats"];
}) {
  const urls: Record<string, Record<string, Record<string, pulumi.Output<string>>>> = {};
  const heartbeats = args.heartbeats.map(
    ({ environment, service, name, periodSeconds, graceSeconds }) => {
      // Dots never occur in a member key or a job name, so the resource name is unique.
      const heartbeat = new betterstack.Heartbeat(`heartbeat-${environment}.${service}.${name}`, {
        name: `${args.project} ${environment} ${service}/${name}`,
        period: periodSeconds,
        grace: graceSeconds,
        email: true,
        push: true,
      });
      ((urls[environment] ??= {})[service] ??= {})[name] = pulumi.secret(heartbeat.url);
      return heartbeat;
    },
  );
  return { heartbeats, urls };
}
