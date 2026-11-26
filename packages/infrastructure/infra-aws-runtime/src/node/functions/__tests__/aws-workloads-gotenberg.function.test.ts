/**
 * Stackra file contract:
 * Purpose: unit tests of `awsWorkloads` for a `gotenberg` engine under Pulumi's mocks: its task pulls the image through
 *          the named ECR registry; it gets its own group, in on 3000 from the consumers and out on tcp/443 only; outside
 *          production it runs on FARGATE_SPOT with the cluster's capacity providers; without a registry the plan is
 *          refused before anything is declared.
 * Boundary: test only; no cloud is called and no state is written (`pulumi.runtime.setMocks`).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0493 (as amended: the gotenberg resource).
 */
import * as pulumi from "@pulumi/pulumi";
import { beforeAll, describe, expect, it } from "@stackra/testing";

import { GOTENBERG_SETTINGS } from "#core/constants/gotenberg-settings.constant";
import { gotenbergWorkload } from "#core/functions/gotenberg-workload.function";
import type { RuntimePlan } from "#core/types/runtime-plan.type";
import { awsWorkloads } from "#node/functions/aws-workloads.function";

/** One resource the program registered. */
type Registered = {
  readonly type: string;
  readonly name: string;
  readonly inputs: Record<string, unknown>;
};

const registered: Registered[] = [];

const REGISTRY = "111122223333.dkr.ecr.me-central-1.amazonaws.com";

const PLAN: RuntimePlan = {
  project: "tamo",
  environment: "staging",
  queues: [],
  caches: [],
  buckets: [],
  databases: [],
  workloads: [gotenbergWorkload("pdf", "tamo-staging-pdf", "small", "staging")],
  cost: { items: [], monthlyUsd: 0 },
};

const NETWORK = { subnetIds: ["subnet-a"], securityGroupIds: ["sg-encore"], vpcId: "vpc-1" };

/** The registered resource whose type ends in `:<kind>` and whose logical name is `name`. */
function resource(kind: string, name: string): Registered {
  const found = registered.find((entry) => entry.type.endsWith(`:${kind}`) && entry.name === name);
  if (found === undefined) throw new Error(`No ${kind} named ${name} was registered`);
  return found;
}

beforeAll(async () => {
  await pulumi.runtime.setMocks(
    {
      newResource: (args) => {
        const inputs = args.inputs as Record<string, unknown>;
        registered.push({ type: args.type, name: args.name, inputs });
        return { id: `${args.name}-id`, state: { ...inputs, arn: `arn:mock:${args.name}` } };
      },
      call: (args) => ({
        ...(args.inputs as Record<string, unknown>),
        name: "me-central-1",
        accountId: "111122223333",
      }),
    },
    "infra-aws-runtime",
    "staging",
    false,
  );
  awsWorkloads(PLAN, { network: NETWORK, workloads: { registry: REGISTRY } }, "sg-workloads");
  let count = -1;
  while (count !== registered.length) {
    count = registered.length;
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
  }
});

describe("awsWorkloads for a gotenberg engine", () => {
  it("pulls the pinned image through the ECR registry", () => {
    const task = resource("TaskDefinition", "tamo-staging-pdf").inputs;
    const [container] = JSON.parse(String(task["containerDefinitions"])) as {
      image: string;
      command: string[];
      portMappings: unknown;
      secrets: { name: string; valueFrom: string }[];
    }[];

    expect(container?.image).toBe(`${REGISTRY}/${GOTENBERG_SETTINGS.image}`);
    expect(container?.command).toEqual([...GOTENBERG_SETTINGS.command]);
    expect(container?.portMappings).toEqual([{ containerPort: 3000, protocol: "tcp" }]);
    expect(container?.secrets).toEqual([
      {
        name: "GOTENBERG_API_BASIC_AUTH_PASSWORD",
        valueFrom: "/tamo/staging/workloads/pdf/GOTENBERG_API_BASIC_AUTH_PASSWORD",
      },
    ]);
  });

  it("gives it its own group: in on 3000 from the consumers, out on 443 only", () => {
    const group = resource("SecurityGroup", "tamo-staging-pdf-sg").inputs;

    expect(group["ingress"]).toEqual([
      expect.objectContaining({
        protocol: "tcp",
        fromPort: 3000,
        toPort: 3000,
        securityGroups: ["sg-workloads", "sg-encore"],
      }),
    ]);
    expect(group["egress"]).toEqual([
      expect.objectContaining({ protocol: "tcp", fromPort: 443, toPort: 443 }),
    ]);
  });

  it("runs it on FARGATE_SPOT with the cluster's capacity providers", () => {
    // the ECS service, not the service-discovery entry of the same name
    const service = registered.find(
      (entry) => entry.type === "aws:ecs/service:Service" && entry.name === "tamo-staging-pdf",
    )?.inputs;
    if (service === undefined) throw new Error("No ECS service tamo-staging-pdf was registered");

    expect(service["capacityProviderStrategies"]).toEqual([
      expect.objectContaining({ capacityProvider: "FARGATE_SPOT", weight: 1 }),
    ]);
    expect(service).not.toHaveProperty("launchType");
    expect(
      registered.find((entry) => entry.type.endsWith(":ClusterCapacityProviders"))?.inputs[
        "capacityProviders"
      ],
    ).toEqual(["FARGATE", "FARGATE_SPOT"]);
  });

  it("refuses an engine when no registry is named", () => {
    expect(() => awsWorkloads(PLAN, { network: NETWORK }, "sg-workloads")).toThrow(
      /workloads\.registry/,
    );
  });
});
