/**
 * Stackra file contract:
 * Purpose: `awsRuntimeStack(args)`, the runtime stack one service (or several) deploys through: reads the repository's
 *          runways, narrows the environment's plan to the named members (all when none is named), resolves the
 *          runtime network from the root runway's `shared.network` through the stack config, and declares the
 *          resources with `awsRuntime`. Returns their identifiers for the stack to export.
 * Boundary: the program body of one Pulumi stack (`<project>-<env>-runtime[-<member>]` in the stacks repository); agents
 *           only preview it or run it under mocks. The provider and credentials are the stack's (the environment's
 *           infra role from `@stackra/infra-aws`).
 * Runtime: node
 * Governing contract: ADR 0171 (decisions 2 to 5), ADR 0296 (decisions 1 and 2), ADR 0402 (one service deploys through
 *                     the runtime stack).
 */
import { join } from "node:path";

import { RunwayKind } from "@stackra/runway";
import type { RunwayEnvironment } from "@stackra/runway";
import { readRunway } from "@stackra/runway/node";

import { planForMembers } from "#core/functions/plan-for-members.function";
import { runtimeNetwork } from "#core/functions/runtime-network.function";
import { awsRuntime } from "#node/functions/aws-runtime.function";
import { readRuntimePlan } from "#node/functions/read-runtime-plan.function";
import { resolveRef } from "#node/functions/resolve-ref.function";
import type { AwsRuntime } from "#node/types/aws-runtime.type";

/**
 * The runtime of `args.members` in `args.environment`.
 *
 * @param args.directory - the repository root.
 * @param args.members - the members this stack deploys; every member when absent.
 * @param args.tags - extra tags on every resource.
 * @throws RunwayInvalidError when a runway is invalid or the network is not named; Pulumi's config error when a `ref:`
 *         is unset.
 * @example
 * // figentra/infra, os/staging-runtime-commerce/index.ts
 * export const runtime = awsRuntimeStack({ directory: "../os", environment: "staging", members: ["commerce"] });
 */
export function awsRuntimeStack(args: {
  readonly directory: string;
  readonly environment: RunwayEnvironment;
  readonly members?: readonly string[];
  readonly tags?: Readonly<Record<string, string>>;
}): AwsRuntime {
  const root = readRunway(join(args.directory, "runway.yaml"), RunwayKind.Root);
  const plan = readRuntimePlan(args.directory, args.environment);
  const network = runtimeNetwork(root, args.environment);
  return awsRuntime(args.members === undefined ? plan : planForMembers(plan, args.members), {
    network: {
      subnetIds: network.subnetIds.map((id) => resolveRef(id)),
      securityGroupIds: network.securityGroupIds.map((id) => resolveRef(id)),
    },
    tags: args.tags,
  });
}
