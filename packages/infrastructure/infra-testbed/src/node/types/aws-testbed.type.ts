/**
 * Stackra file contract:
 * Purpose: `AwsTestbed`, what `awsTestbed` returns: the ids a stack exports and the owner copies (the instance role
 *          ARN goes into the Infisical machine identity's AWS auth, the AMI parameter and the pipeline ARN into the
 *          image runbook).
 * Boundary: a type only; every value is an id or a name, never a secret.
 * Runtime: node
 * Governing contract: ADR 0484; ADR 0173.
 */
import type * as pulumi from "@pulumi/pulumi";

export type AwsTestbed = {
  readonly region: string;
  readonly securityGroupId: pulumi.Output<string>;
  readonly instanceRoleArn: pulumi.Output<string>;
  readonly launchTemplateId: pulumi.Output<string>;
  readonly buildBucket: pulumi.Output<string>;
  readonly imagePipelineArn: pulumi.Output<string>;
  readonly imageVersion: string;
  readonly amiParameter: string;
  /** Auto Scaling group names; absent when the program ran with `groups: false`. */
  readonly groups?: { readonly heavy: string; readonly light: string };
};
