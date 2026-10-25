/**
 * Stackra file contract:
 * Purpose: `GcpBaselineOutputs`, what an environment's GCP foundation exports: the data key, the files bucket, the
 *          infra service account and the Workload Identity provider a deploy job authenticates with, and the budget
 *          topic; `null` where the runway asked for none or another environment owns the project-wide resource.
 * Boundary: type only; the stack exports these, and the stacks repository turns the bucket name into the services'
 *           `filesystem.s3.bucket` and the provider and service account into the deploy job's auth step.
 * Runtime: node
 * Governing contract: ADR 0354 (decision 3), ADR 0171 (decision 4), ADR 0172.
 */
import type * as pulumi from "@pulumi/pulumi";

/** One environment's foundation outputs. */
export type GcpBaselineOutputs = {
  /** The environment's data key (its Cloud KMS resource id), which the files bucket is encrypted with. */
  readonly dataKeyId: pulumi.Output<string>;
  /** The files bucket's name. */
  readonly filesBucket: pulumi.Output<string> | null;
  /** The email of the service account the GitHub deploy job of this environment impersonates. */
  readonly infraServiceAccount: pulumi.Output<string> | null;
  /** The Workload Identity provider's resource name, which the deploy job's auth step names. */
  readonly workloadIdentityProvider: pulumi.Output<string> | null;
  /** The topic the budget notifications go to. */
  readonly budgetTopic: pulumi.Output<string> | null;
};
