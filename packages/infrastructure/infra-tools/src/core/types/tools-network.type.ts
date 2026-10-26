/**
 * Stackra file contract:
 * Purpose: `ToolsNetwork`, the network one region's tools stack runs in: the VPC, the private subnets and the
 *          security groups, each an id or `ref:<path>`.
 * Boundary: type only; read from the root runway's `providers.tools.network.<region>`.
 * Runtime: isomorphic
 * Governing contract: ADR 0444; ADR 0171 (`ref:` values from the stacks repository).
 */

/** One region's network. */
export type ToolsNetwork = {
  /** The VPC, an id or `ref:<path>`. */
  readonly vpcId: string;
  /** The private subnets the tasks run in, each an id or `ref:<path>`. */
  readonly subnetIds: readonly string[];
  /** The security groups of the tasks, each an id or `ref:<path>`. */
  readonly securityGroupIds: readonly string[];
};
