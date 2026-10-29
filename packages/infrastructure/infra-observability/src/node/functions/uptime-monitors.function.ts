/**
 * Stackra file contract:
 * Purpose: `uptimeMonitors(args)`, one Better Stack uptime monitor per planned public URL (`observability.uptime`):
 *          Better Stack requests the URL every `checkFrequencySeconds` from outside and, when it stops answering 2xx
 *          (or one of `expectedStatusCodes`), opens an incident that mails and pushes whoever is on call (ADR 0185
 *          decision 1). The guard against a Worker or host that is down while nothing inside it can report.
 * Boundary: declares Pulumi resources only. Every URL and interval is the runway's; nothing is typed here. The
 *           provider's API token (`better-uptime:apiToken`) is the owner's stack config.
 * Runtime: node
 * Governing contract: ADR 0185 (decision 1: Better Stack runs on-call), ADR 0184, ADR 0453 (the registry every buyer
 *                     installs from). STA-1573. STA-1220 (the return type is written out, so the declaration emit
 *                     names the provider classes through the package entry, not their `bin/` files).
 */
import * as betterstack from "pulumi-better-uptime";

import type { ObservabilityPlan } from "#core/types/observability-plan.type";

/**
 * The uptime monitors, in the plan's order.
 *
 * @param args - the project (prefixes each name) and the plan's uptime targets.
 * @example
 * const { monitors } = uptimeMonitors({ project: "stackra", uptime: plan.uptime });
 */
export function uptimeMonitors(args: {
  readonly project: string;
  readonly uptime: ObservabilityPlan["uptime"];
}): { readonly monitors: betterstack.Monitor[] } {
  const monitors = args.uptime.map(
    ({ environment, name, url, checkFrequencySeconds, expectedStatusCodes }) =>
      // Dots never occur in an environment or an uptime name, so the resource name is unique.
      new betterstack.Monitor(`uptime-${environment}.${name}`, {
        pronounceableName: `${args.project} ${environment} ${name}`,
        url,
        checkFrequency: checkFrequencySeconds,
        ...(expectedStatusCodes === null
          ? { monitorType: "status" }
          : { monitorType: "expected_status_code", expectedStatusCodes: [...expectedStatusCodes] }),
        email: true,
        push: true,
      }),
  );
  return { monitors };
}
