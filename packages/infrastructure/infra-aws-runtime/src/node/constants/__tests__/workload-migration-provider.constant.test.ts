/**
 * Stackra file contract:
 * Purpose: unit tests of `WORKLOAD_MIGRATION_PROVIDER`: create runs the migration task once on Fargate in the
 *          workload's subnets and security group with no public address, waits until it stops, and keeps its ARN; a
 *          non-zero exit, a task ECS did not start and a task past its timeout (stopped) each fail naming the service
 *          and that the rollout did not start; only a new task definition revision or cluster runs it again, and an
 *          update does.
 * Boundary: test only; `@aws-sdk/client-ecs` is mocked, so no AWS call is made.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0493 (as amended: a workload's migrate task).
 */
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { WORKLOAD_MIGRATION_PROVIDER } from "#node/constants/workload-migration-provider.constant";
import type { WorkloadMigrationInputs } from "#node/types/workload-migration-inputs.type";

/** What the mocked ECS client was sent, and what it answers. */
type EcsMock = {
  sent: { command: string; input: Record<string, unknown> }[];
  started: unknown;
  states: unknown[];
};

const ecs = vi.hoisted((): EcsMock => ({ sent: [], started: undefined, states: [] }));

vi.mock("@aws-sdk/client-ecs", () => {
  class Command {
    constructor(readonly input: Record<string, unknown>) {}
  }
  class RunTaskCommand extends Command {}
  class DescribeTasksCommand extends Command {}
  class StopTaskCommand extends Command {}
  class ECSClient {
    send(command: Command): Promise<unknown> {
      ecs.sent.push({ command: command.constructor.name, input: command.input });
      if (command instanceof RunTaskCommand) return Promise.resolve(ecs.started);
      if (command instanceof DescribeTasksCommand)
        return Promise.resolve({ tasks: [ecs.states.shift()] });
      return Promise.resolve({});
    }
  }
  return { ECSClient, RunTaskCommand, DescribeTasksCommand, StopTaskCommand };
});

const INPUTS: WorkloadMigrationInputs = {
  name: "notify-staging-chatwoot_web",
  region: "me-central-1",
  cluster: "arn:aws:ecs:me-central-1:1:cluster/notify-staging-workloads",
  taskDefinition:
    "arn:aws:ecs:me-central-1:1:task-definition/notify-staging-chatwoot_web-migrate:3",
  container: "chatwoot_web",
  subnets: ["subnet-a", "subnet-b"],
  securityGroups: ["sg-workloads"],
  timeoutMinutes: 15,
  pollSeconds: 0,
};

/** A stopped task whose container exited with `exitCode`. */
const stopped = (exitCode: number) => ({
  lastStatus: "STOPPED",
  containers: [{ name: "chatwoot_web", exitCode }],
});

/** The message of the failure `run` ends in. */
async function failureOf(run: Promise<unknown> | undefined): Promise<string> {
  return (
    (await run?.then(
      () => "",
      (error: unknown) => (error instanceof Error ? error.message : String(error)),
    )) ?? ""
  );
}

describe("WORKLOAD_MIGRATION_PROVIDER", () => {
  beforeEach(() => {
    ecs.sent.length = 0;
    ecs.states = [];
    ecs.started = { tasks: [{ taskArn: "arn:aws:ecs:me-central-1:1:task/run-1" }] };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("runs the task once in the workload's network, waits for it to stop and keeps its ARN", async () => {
    ecs.states = [{ lastStatus: "RUNNING" }, stopped(0)];

    const result = await WORKLOAD_MIGRATION_PROVIDER.create?.(INPUTS);

    expect(ecs.sent[0]).toEqual({
      command: "RunTaskCommand",
      input: expect.objectContaining({
        cluster: INPUTS.cluster,
        taskDefinition: INPUTS.taskDefinition,
        launchType: "FARGATE",
        count: 1,
        networkConfiguration: {
          awsvpcConfiguration: {
            subnets: ["subnet-a", "subnet-b"],
            securityGroups: ["sg-workloads"],
            assignPublicIp: "DISABLED",
          },
        },
      }),
    });
    expect(ecs.sent.filter((sent) => sent.command === "DescribeTasksCommand")).toHaveLength(2);
    expect(result?.outs).toMatchObject({ task: "arn:aws:ecs:me-central-1:1:task/run-1" });
  });

  it("fails on a non-zero exit, naming the service and the code", async () => {
    ecs.states = [stopped(1)];

    const message = await failureOf(WORKLOAD_MIGRATION_PROVIDER.create?.(INPUTS));

    expect(message).toContain("notify-staging-chatwoot_web");
    expect(message).toContain("exit code 1");
    expect(message).toContain("the rollout did not start");
  });

  it("fails when ECS starts no task, with ECS's reason", async () => {
    ecs.started = { tasks: [], failures: [{ reason: "RESOURCE:MEMORY" }] };

    const message = await failureOf(WORKLOAD_MIGRATION_PROVIDER.create?.(INPUTS));

    expect(message).toContain("RESOURCE:MEMORY");
    expect(ecs.sent.map((sent) => sent.command)).toEqual(["RunTaskCommand"]);
  });

  it("stops a task past its timeout and fails", async () => {
    vi.spyOn(Date, "now")
      .mockReturnValueOnce(0)
      .mockReturnValue(16 * 60_000);

    const message = await failureOf(WORKLOAD_MIGRATION_PROVIDER.create?.(INPUTS));

    expect(message).toContain("ran past 15 minutes");
    expect(ecs.sent.at(-1)).toMatchObject({
      command: "StopTaskCommand",
      input: { task: "arn:aws:ecs:me-central-1:1:task/run-1" },
    });
  });

  it("runs again only for a new revision or cluster, and an update runs it", async () => {
    ecs.states = [stopped(0)];
    const olds = (await WORKLOAD_MIGRATION_PROVIDER.create?.(INPUTS))?.outs;

    expect(await WORKLOAD_MIGRATION_PROVIDER.diff?.("m", olds, INPUTS)).toEqual({ changes: false });
    expect(
      await WORKLOAD_MIGRATION_PROVIDER.diff?.("m", olds, { ...INPUTS, timeoutMinutes: 30 }),
    ).toEqual({ changes: false });
    const next = { ...INPUTS, taskDefinition: INPUTS.taskDefinition.replace(/:3$/, ":4") };
    expect(await WORKLOAD_MIGRATION_PROVIDER.diff?.("m", olds, next)).toEqual({ changes: true });

    ecs.sent.length = 0;
    ecs.states = [stopped(0)];
    await WORKLOAD_MIGRATION_PROVIDER.update?.("m", olds, next);
    expect(ecs.sent[0]?.input).toMatchObject({ taskDefinition: next.taskDefinition });
  });
});
