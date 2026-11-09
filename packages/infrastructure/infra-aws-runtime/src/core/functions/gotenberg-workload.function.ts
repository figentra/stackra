/**
 * Stackra file contract:
 * Purpose: `gotenbergWorkload`, the workload a `gotenberg` resource runs: Gotenberg's Chromium image under the
 *          pull-through registry, internal on port 3000 with no health path, sized from `GOTENBERG_SIZES`, one task (up
 *          to two in production), its basic-auth pair as its own secrets, its own security group with egress on
 *          tcp/443 only, and FARGATE_SPOT outside production.
 * Boundary: pure. The service name follows the plan's rule (`<project>-<env>-<resource>`); the credentials and the
 *           consumers' variables are `ensureGotenbergCredentials`' (./node), never here.
 * Runtime: isomorphic
 * Governing contract: ADR 0493 (as amended: the gotenberg resource), ADR 0444 (decision 4: Fargate).
 */
import { type ResourceSize, RunwayEnvironment } from "@stackra/runway";

import { GOTENBERG_SETTINGS } from "#core/constants/gotenberg-settings.constant";
import { GOTENBERG_SIZES } from "#core/constants/gotenberg-sizes.constant";
import type { WorkloadPlan } from "#core/types/workload-plan.type";

/**
 * The workload of the `gotenberg` resource `resource`, named `name`, sized `size`, in `environment`.
 *
 * @example
 * gotenbergWorkload("pdf", "acme-staging-pdf", ResourceSize.Small, "staging");
 */
export function gotenbergWorkload(
  resource: string,
  name: string,
  size: ResourceSize,
  environment: RunwayEnvironment,
): WorkloadPlan {
  const sized = GOTENBERG_SIZES[size];
  const production = environment === RunwayEnvironment.Production;
  return {
    key: `resources.${resource}`,
    workload: resource,
    name,
    image: GOTENBERG_SETTINGS.image,
    port: GOTENBERG_SETTINGS.port,
    healthCommand: [],
    command: [...GOTENBERG_SETTINGS.command],
    public: false,
    env: { [GOTENBERG_SETTINGS.serverUser]: GOTENBERG_SETTINGS.user },
    secrets: [GOTENBERG_SETTINGS.serverPassword],
    uses: [],
    aliases: {},
    cpu: sized.cpu,
    memoryMb: sized.memoryMb,
    scale: production ? { min: 1, max: 2 } : { min: 1, max: 1 },
    tags: { env: environment, service: resource },
    gotenberg: { resource },
    registryImage: true,
    httpsEgressOnly: true,
    ...(production ? {} : { spot: true }),
  };
}
