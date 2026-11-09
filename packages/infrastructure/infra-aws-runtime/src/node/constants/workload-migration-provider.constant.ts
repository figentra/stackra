/**
 * Stackra file contract:
 * Purpose: `WORKLOAD_MIGRATION_PROVIDER`, the Pulumi dynamic provider behind a workload's `migrate`: on create, and on
 *          an update to a new revision of the migration task definition (a new image, command, env or secret name), it
 *          runs the task once on Fargate in the workload's subnets and security group, waits for it to stop, and fails
 *          unless its container exited 0. A task past its timeout is stopped and fails. A delete runs nothing.
 * Boundary: ECS has no pre-deploy hook, so this calls ECS's RunTask, DescribeTasks and StopTask through
 *           `@aws-sdk/client-ecs`, imported inside the call so Pulumi's closure serialisation captures no module; the
 *           program that declares it resolves that package (the stacks repository lists it beside `@pulumi/aws`). The
 *           credentials are the deploy job's, the environment's infra role. No secret enters the inputs or the state:
 *           the task reads its own from SSM. A failure names the task and its exit code or stop reason, never output.
 * Runtime: node
 * Governing contract: ADR 0493 (as amended: a workload's migrate task), ADR 0444 (decision 4: Fargate), ADR 0173.
 */
import type { dynamic } from "@pulumi/pulumi";

import type { WorkloadMigrationInputs } from "#node/types/workload-migration-inputs.type";

/** What the state keeps: the inputs and the ARN of the task that last ran. */
type WorkloadMigrationOutputs = WorkloadMigrationInputs & { readonly task: string };

/** Runs the migration task once and waits for it; returns its ARN. */
async function migrate(inputs: WorkloadMigrationInputs): Promise<string> {
  const { DescribeTasksCommand, ECSClient, RunTaskCommand, StopTaskCommand } =
    await import("@aws-sdk/client-ecs");
  const ecs = new ECSClient({ region: inputs.region });
  const started = await ecs.send(
    new RunTaskCommand({
      cluster: inputs.cluster,
      taskDefinition: inputs.taskDefinition,
      launchType: "FARGATE",
      count: 1,
      startedBy: "runway-migrate",
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: [...inputs.subnets],
          securityGroups: [...inputs.securityGroups],
          assignPublicIp: "DISABLED",
        },
      },
    }),
  );
  const arn = started.tasks?.[0]?.taskArn;
  if (arn === undefined)
    throw new Error(
      `${inputs.name}: ECS started no migration task (${started.failures?.map((failure) => failure.reason).join(", ") ?? "no reason given"}); the rollout did not start`,
    );

  const deadline = Date.now() + inputs.timeoutMinutes * 60_000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => {
      setTimeout(resolve, inputs.pollSeconds * 1000);
    });
    const described = await ecs.send(
      new DescribeTasksCommand({ cluster: inputs.cluster, tasks: [arn] }),
    );
    const task = described.tasks?.[0];
    if (task?.lastStatus !== "STOPPED") continue;
    const exitCode = task.containers?.find(
      (container) => container.name === inputs.container,
    )?.exitCode;
    if (exitCode === 0) return arn;
    throw new Error(
      `${inputs.name}: the migration task ${arn} failed (${exitCode === undefined ? (task.stoppedReason ?? "no exit code") : `exit code ${exitCode}`}); the rollout did not start`,
    );
  }
  await ecs.send(
    new StopTaskCommand({ cluster: inputs.cluster, task: arn, reason: "runway migrate timeout" }),
  );
  throw new Error(
    `${inputs.name}: the migration task ${arn} ran past ${inputs.timeoutMinutes} minutes and was stopped; the rollout did not start`,
  );
}

/**
 * The dynamic provider of a workload's migration run.
 *
 * @example
 * new pulumi.dynamic.Resource(WORKLOAD_MIGRATION_PROVIDER, "notify-staging-chatwoot_web-migrate", inputs);
 */
export const WORKLOAD_MIGRATION_PROVIDER: dynamic.ResourceProvider = {
  async create(inputs: WorkloadMigrationInputs): Promise<dynamic.CreateResult> {
    const outs: WorkloadMigrationOutputs = { ...inputs, task: await migrate(inputs) };
    return { id: `${inputs.name}-migrate`, outs };
  },

  async diff(
    _id: string,
    olds: WorkloadMigrationOutputs,
    news: WorkloadMigrationInputs,
  ): Promise<dynamic.DiffResult> {
    // Only a new revision, or another cluster, runs the migration again; a new timeout waits for the next one.
    return {
      changes: olds.taskDefinition !== news.taskDefinition || olds.cluster !== news.cluster,
    };
  },

  async update(
    _id: string,
    _olds: WorkloadMigrationOutputs,
    news: WorkloadMigrationInputs,
  ): Promise<dynamic.UpdateResult> {
    const outs: WorkloadMigrationOutputs = { ...news, task: await migrate(news) };
    return { outs };
  },
};
