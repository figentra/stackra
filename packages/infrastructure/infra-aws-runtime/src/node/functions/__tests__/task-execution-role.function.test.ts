/**
 * Stackra file contract:
 * Purpose: unit tests of `taskExecutionRole` under Pulumi's mocks: the role may be assumed by ECS tasks alone, carries
 *          the given tags, and gets the AWS-managed task execution policy attached under the same name.
 * Boundary: test only; no cloud is called and no state is written (`pulumi.runtime.setMocks`).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0444 (decision 4); ADR 0493 (decision 2).
 */
import * as pulumi from "@pulumi/pulumi";
import { beforeAll, describe, expect, it } from "@stackra/testing";

import { taskExecutionRole } from "#node/functions/task-execution-role.function";

/** One resource the program registered. */
type Registered = {
  readonly type: string;
  readonly name: string;
  readonly inputs: Record<string, unknown>;
};

const registered: Registered[] = [];

beforeAll(async () => {
  await pulumi.runtime.setMocks(
    {
      newResource: (args) => {
        const inputs = args.inputs as Record<string, unknown>;
        registered.push({ type: args.type, name: args.name, inputs });
        return { id: `${args.name}-id`, state: { ...inputs, name: args.name } };
      },
      call: (args) => args.inputs as Record<string, unknown>,
    },
    "infra-aws-runtime",
    "dev",
    false,
  );
  const role = taskExecutionRole("academorix-dev-db-setup-execution", { env: "dev" });
  await new Promise((resolve) => {
    role.arn.apply(resolve);
  });
  let count = -1;
  while (count !== registered.length) {
    count = registered.length;
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
  }
});

describe("taskExecutionRole", () => {
  it("declares a role only ECS tasks may assume, with the given tags", () => {
    const role = registered.find((entry) => entry.type === "aws:iam/role:Role");
    expect(role?.name).toBe("academorix-dev-db-setup-execution");
    expect(JSON.parse(String(role?.inputs.assumeRolePolicy))).toEqual({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { Service: "ecs-tasks.amazonaws.com" },
          Action: "sts:AssumeRole",
        },
      ],
    });
    expect(role?.inputs.tags).toEqual({ env: "dev" });
  });

  it("attaches the managed task execution policy under the role's name", () => {
    const attachment = registered.find(
      (entry) => entry.type === "aws:iam/rolePolicyAttachment:RolePolicyAttachment",
    );
    expect(attachment?.name).toBe("academorix-dev-db-setup-execution");
    expect(attachment?.inputs).toEqual({
      role: "academorix-dev-db-setup-execution",
      policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
    });
  });
});
