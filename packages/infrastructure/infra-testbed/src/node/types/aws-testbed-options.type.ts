/**
 * Stackra file contract:
 * Purpose: `AwsTestbedOptions`, what `awsTestbed` takes besides the plan: the SSH allowlist, the core lockfile the
 *          image warms its pnpm store from, an optional VPC and subnets (the default VPC otherwise), extra tags, and
 *          `groups: false` for the first apply (image pipeline only, before the first AMI exists).
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0484 (decisions 2, 3, 8, 9).
 */
export type AwsTestbedOptions = {
  /** CIDRs allowed to reach port 22. The `stackra testbed` CLI swaps its own entry at run time, so changes to the live rules are ignored after creation. */
  readonly allowedCidrs: readonly string[];
  /** The core `pnpm-lock.yaml` the image's pnpm store is warmed from. */
  readonly lockfilePath: string;
  readonly vpcId?: string;
  readonly subnetIds?: readonly string[];
  readonly tags?: Readonly<Record<string, string>>;
  /** `false` declares everything except the Auto Scaling groups: the launch template needs an AMI to exist. Default `true`. */
  readonly groups?: boolean;
};
