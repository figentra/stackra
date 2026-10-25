/**
 * Stackra file contract:
 * Purpose: `StateBackendOutputs`, the Pulumi state backend's bucket and key, which the stacks repository records as
 *          `aws.state.bucket` and `aws.state.kmsKey` (the root runway's `providers.aws.state` refs).
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0171 (decision 4 as amended by 0289 decision 9).
 */
import type * as pulumi from "@pulumi/pulumi";

/** The state backend. */
export type StateBackendOutputs = {
  /** The bucket's name (`pulumi login s3://<bucket>`). */
  readonly bucket: pulumi.Output<string>;
  /** The key the state is encrypted with. */
  readonly kmsKeyArn: pulumi.Output<string>;
};
