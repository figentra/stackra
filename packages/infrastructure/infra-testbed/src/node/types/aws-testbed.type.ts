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

/** What `awsTestbed` declared: the ids and names the owner and the CLI read from the stack outputs. */
export type AwsTestbed = {
  /** The AWS region every resource is in. */
  readonly region: string;
  /** The id of the security group that allows SSH from the allowlist only. */
  readonly securityGroupId: pulumi.Output<string>;
  /** The ARN of the box instance role, the principal the Infisical AWS Auth trusts. */
  readonly instanceRoleArn: pulumi.Output<string>;
  /** The id of the launch template both groups start boxes from. */
  readonly launchTemplateId: pulumi.Output<string>;
  /** The name of the bucket holding the image build inputs. */
  readonly buildBucket: pulumi.Output<string>;
  /** The ARN of the weekly image pipeline, which `apply-testbed.yml` starts by hand. */
  readonly imagePipelineArn: pulumi.Output<string>;
  /** The Image Builder version derived from the build inputs. */
  readonly imageVersion: string;
  /** The SSM parameter the pipeline writes the newest AMI id to. */
  readonly amiParameter: string;
  /** Auto Scaling group names; absent when the program ran with `groups: false`. */
  readonly groups?: { readonly heavy: string; readonly light: string };
};
