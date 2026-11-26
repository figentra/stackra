/**
 * Stackra file contract:
 * Purpose: `WorkloadMigrationInputs`, what `WORKLOAD_MIGRATION_PROVIDER` runs a workload's `migrate` task with: the
 *          service it migrates for, the region, cluster and task definition revision, the container whose exit code
 *          counts, the network the task runs in, and how long and how often the rollout waits for it.
 * Boundary: type only; plain values once Pulumi resolves them. No secret appears: the task reads its own from SSM.
 * Runtime: node
 * Governing contract: ADR 0493 (as amended: a workload's migrate task), ADR 0173.
 */

/** One migration run. */
export type WorkloadMigrationInputs = {
  /** The ECS service the migration runs for (`notify-staging-chatwoot_web`), named in every failure. */
  readonly name: string;
  /** The region of the cluster. */
  readonly region: string;
  /** The cluster's ARN. */
  readonly cluster: string;
  /** The migration task definition's ARN; a new revision (image, command, env, secret names) runs it again. */
  readonly taskDefinition: string;
  /** The container whose exit code decides the run. */
  readonly container: string;
  /** The private subnets the task runs in. */
  readonly subnets: readonly string[];
  /** The workload security group, which the databases admit. */
  readonly securityGroups: readonly string[];
  /** How long the rollout waits before it stops the task and fails. */
  readonly timeoutMinutes: number;
  /** Seconds between two looks at the task. */
  readonly pollSeconds: number;
};
