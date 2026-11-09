/**
 * Stackra file contract:
 * Purpose: `RuntimeNetwork`, where the runtime's resources run as the root runway names it: the private subnets and
 *          the security groups of the services' VPC, and that VPC, each an id or `ref:<path>`.
 * Boundary: type only; `runtimeNetwork` reads it, the runtime stack resolves the `ref:` values.
 * Runtime: isomorphic
 * Governing contract: ADR 0171 (decision 4: `ref:` values), ADR 0402.
 */

/** The runtime network. */
export type RuntimeNetwork = {
  /** Private subnet ids, or `ref:<path>` values. */
  readonly subnetIds: readonly string[];
  /** Security group ids, or `ref:<path>` values. */
  readonly securityGroupIds: readonly string[];
  /** The VPC id, or a `ref:<path>` value; workloads and databases need it, caches and queues do not. */
  readonly vpcId?: string;
};
