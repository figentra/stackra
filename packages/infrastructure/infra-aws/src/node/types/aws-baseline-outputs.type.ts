/**
 * Stackra file contract:
 * Purpose: `AwsBaselineOutputs`, what an environment's AWS foundation exports: the data key, the files bucket, the
 *          backup vault, the infra and Encore Cloud role ARNs and the budget topic; `null` where the runway asked for
 *          none or another environment owns the account-wide resource.
 * Boundary: type only; the stack exports these, and the stacks repository turns the bucket name into the services'
 *           `filesystem.s3.bucket` and the Encore role ARN into Encore Cloud's AWS connection.
 * Runtime: node
 * Governing contract: ADR 0171 (decision 4), ADR 0186, ADR 0172.
 */
import type * as pulumi from "@pulumi/pulumi";

/** One environment's foundation outputs. */
export type AwsBaselineOutputs = {
  /** The environment's data key, which the database, the files and the backup vault are encrypted with. */
  readonly dataKeyArn: pulumi.Output<string>;
  /** The files bucket's name. */
  readonly filesBucket: pulumi.Output<string> | null;
  /** The environment's backup vault. */
  readonly backupVaultArn: pulumi.Output<string> | null;
  /** The role the GitHub deploy job of this environment assumes. */
  readonly infraRoleArn: pulumi.Output<string> | null;
  /** The role Encore Cloud assumes. */
  readonly encoreRoleArn: pulumi.Output<string> | null;
  /** The topic the budget alerts go to. */
  readonly budgetTopicArn: pulumi.Output<string> | null;
};
