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
  readonly vpcId: string;
  readonly subnetIds: readonly string[];
  readonly securityGroupIds: readonly string[];
};
