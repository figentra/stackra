/**
 * Stackra file contract:
 * Purpose: `AwsRuntimeOptions`, what `awsRuntime` needs beside the plan: the network the caches join (the private
 *          subnets and the security groups of the VPC the services run in) and the tags every resource adds.
 * Boundary: type only. The network comes from the stack that owns the VPC (the AWS foundation stack, or Encore Cloud's
 *           VPC), usually as stack-reference outputs, so the fields take Pulumi inputs.
 * Runtime: node
 * Governing contract: ADR 0171 (decisions 2 and 5), ADR 0172 (decision 5: cost tags).
 */
import type { Input } from "@pulumi/pulumi";

/** `awsRuntime`'s options. */
export type AwsRuntimeOptions = {
  /** Where the caches run; required even when a plan has no cache, so a later cache never lands on a default VPC. */
  readonly network: {
    /** Private subnets, in two or more availability zones for a cache with replicas. */
    readonly subnetIds: Input<Input<string>[]>;
    /** The security groups that let the service processes reach port 6379. */
    readonly securityGroupIds: Input<Input<string>[]>;
  };
  /** Tags every resource carries besides the plan's `env`, `service` and `group` (which win on a clash). */
  readonly tags?: Readonly<Record<string, string>> | undefined;
};
