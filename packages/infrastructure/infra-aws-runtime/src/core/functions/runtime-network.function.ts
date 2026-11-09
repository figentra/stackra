/**
 * Stackra file contract:
 * Purpose: `runtimeNetwork(root, environment)`, the runtime network of an environment from the root runway's
 *          `environments.<env>.shared.network`: `subnetIds` and `securityGroupIds`, each a list of ids or `ref:<path>`
 *          values, and `vpcId`, one id or `ref:<path>` (the VPC is Encore Cloud's or the network stack's, whose outputs
 *          the stacks repository copies in). Workloads and databases need the VPC; caches and queues do not.
 * Boundary: pure; nothing is resolved here. Both lists are required, so a cache never lands on a default VPC. `vpcId`
 *           is optional here: awsWorkloads and awsDatabases refuse a plan that needs it when it is absent.
 * Runtime: isomorphic
 * Governing contract: ADR 0171 (decisions 4 and 5), ADR 0296 (decision 2: shared resources are root facts), ADR 0402.
 */
import { RunwayInvalidError } from "@stackra/runway";
import type { RootRunway, RunwayEnvironment, RunwayIssue } from "@stackra/runway";

import type { RuntimeNetwork } from "#core/types/runtime-network.type";

/** An id or `ref:<path>`. */
const ID = /^(ref:[A-Za-z0-9_.-]+|[a-z]+-[0-9a-f]+)$/;

/** An ECR registry host, or a `ref:` the stack resolves. */
const REGISTRY = /^(ref:[A-Za-z0-9_./-]+|[0-9]{12}\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com)$/;

/**
 * The network of `environment`.
 *
 * @throws RunwayInvalidError naming each list that is missing, empty or holds something other than an id or `ref:`,
 *         and a `vpcId` that is not one id or `ref:`.
 * @example
 * runtimeNetwork(root, "staging"); // { subnetIds: ["ref:network.staging.subnets.a"], securityGroupIds: ["sg-0abc"], vpcId: "vpc-0abc" }
 */
export function runtimeNetwork(root: RootRunway, environment: RunwayEnvironment): RuntimeNetwork {
  const network = root.environments[environment]?.shared?.network ?? {};
  const issues: RunwayIssue[] = [];
  const listOf = (key: "subnetIds" | "securityGroupIds"): string[] => {
    const value = network[key];
    if (
      Array.isArray(value) &&
      value.length > 0 &&
      value.every((id) => typeof id === "string" && ID.test(id))
    )
      return value as string[];
    issues.push({
      path: `environments.${environment}.shared.network.${key}`,
      message: "List the ids (or ref:<path> values) the runtime's caches join",
    });
    return [];
  };
  const subnetIds = listOf("subnetIds");
  const securityGroupIds = listOf("securityGroupIds");
  const vpcId = network["vpcId"];
  if (vpcId !== undefined && !(typeof vpcId === "string" && ID.test(vpcId)))
    issues.push({
      path: `environments.${environment}.shared.network.vpcId`,
      message: "Name the VPC by its id (or a ref:<path> value) the subnets belong to",
    });
  const registry = network["registry"];
  if (registry !== undefined && !(typeof registry === "string" && REGISTRY.test(registry)))
    issues.push({
      path: `environments.${environment}.shared.network.registry`,
      message:
        "Name the ECR pull-through registry (<account>.dkr.ecr.<region>.amazonaws.com, or a ref:<path> value)",
    });
  if (issues.length > 0) throw new RunwayInvalidError("root runway (AWS runtime)", issues);
  return {
    subnetIds,
    securityGroupIds,
    ...(typeof vpcId === "string" ? { vpcId } : {}),
    ...(typeof registry === "string" ? { registry } : {}),
  };
}
