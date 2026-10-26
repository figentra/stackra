/**
 * Stackra file contract:
 * Purpose: unit tests of `awsToolsStack` under Pulumi's mocks: the provider is pinned to the region and its account;
 *          a tool with an endpoint gets a Fargate service with no public address, registered in the private
 *          namespace; a worker gets no registration; a tool that keeps data mounts its EFS access point; secrets are
 *          parameter references the execution role may read, never values; a region on another cloud is refused.
 * Boundary: test only; no cloud is called and no state is written (`pulumi.runtime.setMocks`).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0444; ADR 0173.
 */
import * as pulumi from "@pulumi/pulumi";
import { beforeAll, describe, expect, it } from "@stackra/testing";

import type { ToolsStackPlan } from "#core/types/tools-stack-plan.type";
import { awsToolsStack } from "#node/functions/aws-tools-stack.function";
import type { AwsToolsStack } from "#node/types/aws-tools-stack.type";

/** One resource the program registered. */
type Registered = {
  readonly type: string;
  readonly name: string;
  readonly inputs: Record<string, unknown>;
};

const registered: Registered[] = [];

const ENDPOINT = {
  tool: "nominatim",
  category: "geocoding",
  provider: "nominatim",
  region: "gcc",
  baseUrl: "http://nominatim.gcc.tools.acme.internal:8080",
};

const PLAN: ToolsStackPlan = {
  project: "acme",
  environment: "production",
  regions: [
    {
      key: "gcc",
      cloud: "aws",
      location: "me-central-1",
      account: "111122223333",
      network: {
        vpcId: "vpc-1",
        subnetIds: ["subnet-a", "subnet-b"],
        securityGroupIds: ["sg-tools"],
      },
      namespace: "gcc.tools.acme.internal",
      logRetentionDays: 30,
      tools: [
        {
          key: "nominatim",
          name: "acme-production-gcc-nominatim",
          image: "mediagis/nominatim:4.5",
          port: 8080,
          cpu: 2048,
          memoryMb: 8192,
          replicas: 1,
          environment: { PBF_URL: "https://download.geofabrik.de/asia/gcc-states-latest.osm.pbf" },
          secrets: [
            {
              name: "NOMINATIM_PASSWORD",
              parameter: "/acme/production/tools/nominatim/NOMINATIM_PASSWORD",
            },
          ],
          volume: "/var/lib/postgresql/16/main",
          endpoint: ENDPOINT,
        },
        {
          key: "chatwoot-worker",
          name: "acme-production-gcc-chatwoot-worker",
          image: "chatwoot/chatwoot:v4.1.0",
          cpu: 1024,
          memoryMb: 2048,
          replicas: 1,
          command: ["bundle", "exec", "sidekiq"],
          environment: {},
          secrets: [],
        },
      ],
    },
    {
      key: "ksa",
      cloud: "gcp",
      location: "me-central2",
      namespace: "ksa.tools.acme.internal",
      logRetentionDays: 30,
      tools: [],
    },
  ],
};

let stack: AwsToolsStack;

/** The registered resource whose type token ends in `:<kind>` and whose logical name is `name`. */
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
      call: (args) =>
        args.token === "aws:index/getCallerIdentity:getCallerIdentity"
          ? { accountId: "111122223333", arn: "arn:mock", userId: "mock", id: "mock" }
          : (args.inputs as Record<string, unknown>),
    },
    "infra-tools",
    "production",
    false,
  );
  stack = awsToolsStack(PLAN, "gcc", { tags: { owner: "platform" } });
  await new Promise((resolve) => {
    stack.cluster.apply(resolve);
  });
  // Registration is asynchronous: wait until no resource has arrived for a while.
  let count = -1;
  while (count !== registered.length) {
    count = registered.length;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
});

describe("awsToolsStack", () => {
  it("pins the provider to the region and its account", () => {
    const provider = resource("providers:aws", "acme-production-gcc-tools");
    expect(provider.inputs.region).toBe("me-central-1");
    // Pulumi hands a provider's non-string inputs over JSON-encoded.
    expect(JSON.parse(String(provider.inputs.allowedAccountIds))).toEqual(["111122223333"]);
  });

  it("runs an endpoint tool privately, registered in the namespace, with its data volume", () => {
    const service = resource("ecs/service:Service", "acme-production-gcc-nominatim");
    expect(service.type).toContain("ecs");
    expect(service.inputs.networkConfiguration).toMatchObject({ assignPublicIp: false });
    expect(service.inputs.serviceRegistries).toBeDefined();
    const discovery = registered.find(
      (entry) =>
        entry.type.includes("servicediscovery/service") &&
        entry.name === "acme-production-gcc-nominatim",
    );
    expect(discovery?.inputs.name).toBe("nominatim");
    const task = resource("TaskDefinition", "acme-production-gcc-nominatim");
    const [container] = JSON.parse(String(task.inputs.containerDefinitions)) as Record<
      string,
      unknown
    >[];
    expect(container?.secrets).toEqual([
      {
        name: "NOMINATIM_PASSWORD",
        valueFrom: "/acme/production/tools/nominatim/NOMINATIM_PASSWORD",
      },
    ]);
    expect(container?.mountPoints).toEqual([
      { sourceVolume: "data", containerPath: "/var/lib/postgresql/16/main" },
    ]);
    expect(
      resource("AccessPoint", "acme-production-gcc-nominatim").inputs.rootDirectory,
    ).toMatchObject({
      path: "/nominatim",
    });
  });

  it("gives a worker no registration", () => {
    const worker = resource("Service", "acme-production-gcc-chatwoot-worker");
    expect(worker.inputs.serviceRegistries).toBeUndefined();
  });

  it("lets the execution role read only the stack's own parameters", () => {
    const policy = resource("RolePolicy", "acme-production-gcc-tools-parameters");
    expect(String(policy.inputs.policy)).toContain(
      "arn:aws:ssm:me-central-1:111122223333:parameter/acme/production/tools/nominatim/*",
    );
  });

  it("returns the region's endpoints", () => {
    expect(stack.endpoints).toEqual([ENDPOINT]);
  });

  it("refuses a region on another cloud", () => {
    expect(() => awsToolsStack(PLAN, "ksa")).toThrow(/only the AWS tools stack is built/);
  });
});
