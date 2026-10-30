/**
 * Stackra file contract:
 * Purpose: unit tests of `awsToolsStack` under Pulumi's mocks: the provider is pinned to the region and its account;
 *          a tool with an endpoint gets a service with no public address, registered in the private namespace; a
 *          GPU tool runs on a capacity provider of GPU instances (launch template on the GPU image, Auto Scaling group,
 *          one GPU in its container) and not on Fargate; a
 *          worker gets no registration and reads the Valkey URL; an EFS tool mounts its access point; an EBS tool runs
 *          on its own EC2 instance with an encrypted, retained disk and a host volume; secrets are parameter references
 *          the execution role may read, never values; the database task carries the admin login and each password as
 *          parameters; the Infisical role trusts only its principal with the external id; another cloud is refused.
 * Boundary: test only; no cloud is called and no state is written (`pulumi.runtime.setMocks`).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0444; ADR 0173; ADR 0238.
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
      gpuHourlyUsdAtMax: 0.98,
      tools: [
        {
          key: "nominatim",
          name: "acme-production-gcc-nominatim",
          image: "mediagis/nominatim:5.3.2",
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
          ebs: { diskGb: 200, instanceType: "m6i.xlarge" },
          endpoint: ENDPOINT,
        },
        {
          key: "libretranslate",
          name: "acme-production-gcc-libretranslate",
          image: "libretranslate/libretranslate:v1.9.6",
          cpu: 2048,
          memoryMb: 4096,
          replicas: 1,
          environment: {},
          secrets: [],
          volume: "/home/libretranslate/.local",
        },
        {
          key: "retrieval-embed",
          name: "acme-production-gcc-retrieval-embed",
          image: "ghcr.io/huggingface/text-embeddings-inference:89-1.9.4",
          port: 80,
          cpu: 2048,
          memoryMb: 8192,
          replicas: 0,
          environment: { MODEL_ID: "BAAI/bge-m3" },
          secrets: [],
          gpu: { instanceType: "g6.xlarge", hourlyUsd: 0.98, maxReplicas: 1 },
          endpoint: {
            tool: "retrieval-embed",
            category: "embedder",
            provider: "tei",
            region: "gcc",
            baseUrl: "http://retrieval-embed.gcc.tools.acme.internal:80",
          },
        },
        {
          key: "chatwoot-worker",
          name: "acme-production-gcc-chatwoot-worker",
          image: "chatwoot/chatwoot:v4.18.0",
          cpu: 1024,
          memoryMb: 2048,
          replicas: 1,
          command: ["bundle", "exec", "sidekiq"],
          environment: {},
          secrets: [
            { name: "DATABASE_URL", parameter: "/acme/production/tools/chatwoot/DATABASE_URL" },
          ],
          cacheVariable: "REDIS_URL",
        },
      ],
      cache: { nodeType: "cache.t4g.micro" },
      databases: [
        {
          tool: "chatwoot",
          name: "chatwoot",
          extensions: ["vector"],
          passwordParameter: "/acme/production/tools/chatwoot/DATABASE_PASSWORD",
        },
      ],
      databaseAdmin: [
        { name: "PGHOST", parameter: "/acme/production/tools/postgres/PGHOST" },
        { name: "PGUSER", parameter: "/acme/production/tools/postgres/PGUSER" },
        { name: "PGPASSWORD", parameter: "/acme/production/tools/postgres/PGPASSWORD" },
      ],
      secretsSync: { principal: "arn:aws:iam::999988887777:root", externalId: "ext-1" },
    },
    {
      key: "ksa",
      cloud: "gcp",
      location: "me-central2",
      namespace: "ksa.tools.acme.internal",
      logRetentionDays: 30,
      gpuHourlyUsdAtMax: 0,
      tools: [],
      databases: [],
      databaseAdmin: [],
    },
  ],
  secretsSync: [
    {
      environment: "production",
      source: "/tools/chatwoot",
      destination: "/acme/production/tools/chatwoot",
      names: ["DATABASE_PASSWORD", "DATABASE_URL"],
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

/** The single container of a registered task definition. */
function containerOf(name: string): Record<string, unknown> {
  const task = resource("TaskDefinition", name);
  const [container] = JSON.parse(String(task.inputs.containerDefinitions)) as Record<
    string,
    unknown
  >[];
  return container ?? {};
}

beforeAll(async () => {
  await pulumi.runtime.setMocks(
    {
      newResource: (args) => {
        const inputs = args.inputs as Record<string, unknown>;
        registered.push({ type: args.type, name: args.name, inputs });
        return {
          id: `${args.name}-id`,
          state: {
            ...inputs,
            arn: `arn:mock:${args.name}`,
            primaryEndpointAddress: "cache.internal",
          },
        };
      },
      call: (args) => {
        if (args.token === "aws:index/getCallerIdentity:getCallerIdentity")
          return { accountId: "111122223333", arn: "arn:mock", userId: "mock", id: "mock" };
        if (args.token === "aws:ec2/getSubnet:getSubnet")
          return { ...args.inputs, availabilityZone: "me-central-1a" };
        if (args.token === "aws:ssm/getParameter:getParameter")
          return { ...args.inputs, value: "ami-ecs", type: "String" };
        return args.inputs as Record<string, unknown>;
      },
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
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
  }
});

describe("awsToolsStack", () => {
  it("pins the provider to the region and its account", () => {
    const provider = resource("providers:aws", "acme-production-gcc-tools");
    expect(provider.inputs.region).toBe("me-central-1");
    // Pulumi hands a provider's non-string inputs over JSON-encoded.
    expect(JSON.parse(String(provider.inputs.allowedAccountIds))).toEqual(["111122223333"]);
  });

  it("runs an EBS tool on its own instance, registered in the namespace", () => {
    const service = resource("ecs/service:Service", "acme-production-gcc-nominatim");
    expect(service.inputs.launchType).toBe("EC2");
    expect(service.inputs.networkConfiguration).not.toHaveProperty("assignPublicIp");
    expect(service.inputs.placementConstraints).toEqual([
      { type: "memberOf", expression: "attribute:stackra.tool == nominatim" },
    ]);
    expect(service.inputs.serviceRegistries).toBeDefined();
    const discovery = registered.find(
      (entry) =>
        entry.type.includes("servicediscovery/service") &&
        entry.name === "acme-production-gcc-nominatim",
    );
    expect(discovery?.inputs.name).toBe("nominatim");

    const disk = resource("Volume", "acme-production-gcc-nominatim");
    expect(disk.inputs).toMatchObject({ size: 200, type: "gp3", encrypted: true });
    const instance = resource("Instance", "acme-production-gcc-nominatim");
    expect(instance.inputs).toMatchObject({
      instanceType: "m6i.xlarge",
      associatePublicIpAddress: false,
      subnetId: "subnet-a",
    });
    expect(String(instance.inputs.userData)).toContain(
      'ECS_INSTANCE_ATTRIBUTES={"stackra.tool":"nominatim"}',
    );
    expect(resource("VolumeAttachment", "acme-production-gcc-nominatim").inputs.volumeId).toBe(
      "acme-production-gcc-nominatim-id",
    );

    const task = resource("TaskDefinition", "acme-production-gcc-nominatim");
    expect(task.inputs.requiresCompatibilities).toEqual(["EC2"]);
    expect(task.inputs.volumes).toEqual([{ name: "data", hostPath: "/data/nominatim" }]);
    const container = containerOf("acme-production-gcc-nominatim");
    expect(container.secrets).toEqual([
      {
        name: "NOMINATIM_PASSWORD",
        valueFrom: "/acme/production/tools/nominatim/NOMINATIM_PASSWORD",
      },
    ]);
  });

  it("keeps an EFS tool on Fargate with its access point", () => {
    const service = resource("ecs/service:Service", "acme-production-gcc-libretranslate");
    expect(service.inputs.launchType).toBe("FARGATE");
    expect(service.inputs.networkConfiguration).toMatchObject({ assignPublicIp: false });
    expect(
      resource("AccessPoint", "acme-production-gcc-libretranslate").inputs.rootDirectory,
    ).toMatchObject({ path: "/libretranslate" });
    expect(
      registered.some(
        (entry) => entry.type.endsWith(":AccessPoint") && entry.name.endsWith("nominatim"),
      ),
    ).toBe(false);
  });

  it("gives a worker no registration and the Valkey URL", () => {
    const worker = resource("Service", "acme-production-gcc-chatwoot-worker");
    expect(worker.inputs.serviceRegistries).toBeUndefined();
    expect(containerOf("acme-production-gcc-chatwoot-worker").environment).toContainEqual({
      name: "REDIS_URL",
      value: "rediss://cache.internal:6379",
    });
    const group = resource("ReplicationGroup", "acme-production-gcc-tools-cache");
    expect(group.inputs).toMatchObject({
      engine: "valkey",
      nodeType: "cache.t4g.micro",
      transitEncryptionEnabled: true,
      atRestEncryptionEnabled: true,
    });
  });

  it("declares the database task with parameters only", () => {
    const container = containerOf("acme-production-gcc-tools-databases");
    expect(container.image).toBe("postgres:17.6-alpine");
    expect(container.secrets).toEqual([
      { name: "PGHOST", valueFrom: "/acme/production/tools/postgres/PGHOST" },
      { name: "PGUSER", valueFrom: "/acme/production/tools/postgres/PGUSER" },
      { name: "PGPASSWORD", valueFrom: "/acme/production/tools/postgres/PGPASSWORD" },
      {
        name: "DB_PASSWORD_CHATWOOT",
        valueFrom: "/acme/production/tools/chatwoot/DATABASE_PASSWORD",
      },
    ]);
    expect(String((container.command as string[])[2])).toContain(
      'CREATE EXTENSION IF NOT EXISTS "vector"',
    );
    expect(stack.databaseTask).toBeDefined();
  });

  it("lets the execution role read only the stack's own parameters", () => {
    const policy = String(
      resource("RolePolicy", "acme-production-gcc-tools-parameters").inputs.policy,
    );
    expect(policy).toContain(
      "arn:aws:ssm:me-central-1:111122223333:parameter/acme/production/tools/nominatim/*",
    );
    expect(policy).toContain(
      "arn:aws:ssm:me-central-1:111122223333:parameter/acme/production/tools/postgres/*",
    );
  });

  it("lets Infisical write the synced folders only, with its external id", () => {
    const role = resource("Role", "acme-production-gcc-tools-secrets-sync");
    const trust = JSON.parse(String(role.inputs.assumeRolePolicy)) as {
      Statement: { Principal: unknown; Condition: unknown }[];
    };
    expect(trust.Statement[0]?.Principal).toEqual({ AWS: "arn:aws:iam::999988887777:root" });
    expect(trust.Statement[0]?.Condition).toEqual({
      StringEquals: { "sts:ExternalId": "ext-1" },
    });
    const policy = String(
      resource("RolePolicy", "acme-production-gcc-tools-secrets-sync").inputs.policy,
    );
    expect(policy).toContain(
      "arn:aws:ssm:me-central-1:111122223333:parameter/acme/production/tools/chatwoot/*",
    );
    expect(policy).not.toContain("parameter/acme/production/tools/nominatim/*");
  });

  it("places a GPU tool on a capacity provider of GPU instances, not Fargate", () => {
    const name = "acme-production-gcc-tools-gpu-g6-xlarge";
    const template = resource("LaunchTemplate", name);
    expect(template.inputs).toMatchObject({
      imageId: "ami-ecs",
      instanceType: "g6.xlarge",
      metadataOptions: { httpTokens: "required" },
    });
    expect(Buffer.from(String(template.inputs.userData), "base64").toString()).toContain(
      "ECS_CLUSTER=",
    );
    const group = resource("Group", name).inputs;
    expect(group).toMatchObject({ minSize: 0, maxSize: 1 });
    expect(group.desiredCapacity).toBeUndefined();
    expect(resource("CapacityProvider", name).inputs).toMatchObject({
      autoScalingGroupProvider: {
        managedScaling: { status: "ENABLED", targetCapacity: 100 },
      },
    });
    expect(resource("ClusterCapacityProviders", "acme-production-gcc-tools").inputs).toBeDefined();

    const service = resource("ecs/service:Service", "acme-production-gcc-retrieval-embed");
    expect(service.inputs.launchType).toBeUndefined();
    expect(service.inputs.desiredCount).toBe(0);
    expect(service.inputs.capacityProviderStrategies).toEqual([
      { capacityProvider: name, weight: 1 },
    ]);
    expect(service.inputs.networkConfiguration).not.toHaveProperty("assignPublicIp");
    const task = resource("TaskDefinition", "acme-production-gcc-retrieval-embed");
    expect(task.inputs.requiresCompatibilities).toEqual(["EC2"]);
    expect(containerOf("acme-production-gcc-retrieval-embed").resourceRequirements).toEqual([
      { type: "GPU", value: "1" },
    ]);
  });

  it("starts a GPU tool asleep and scales it to zero after 30 idle minutes", () => {
    const name = "acme-production-gcc-retrieval-embed";
    expect(resource("Target", name).inputs).toMatchObject({
      serviceNamespace: "ecs",
      scalableDimension: "ecs:service:DesiredCount",
      minCapacity: 0,
      maxCapacity: 1,
    });
    const policy = resource("Policy", `${name}-idle`).inputs;
    expect(policy.policyType).toBe("StepScaling");
    expect(policy.stepScalingPolicyConfiguration).toMatchObject({
      adjustmentType: "ExactCapacity",
      stepAdjustments: [{ metricIntervalUpperBound: "0", scalingAdjustment: 0 }],
    });
    expect(resource("MetricAlarm", `${name}-idle`).inputs).toMatchObject({
      namespace: "AWS/ECS",
      metricName: "CPUUtilization",
      threshold: 5,
      evaluationPeriods: 30,
      period: 60,
      comparisonOperator: "LessThanThreshold",
    });
    // Fargate tools get no idle scaling.
    expect(
      registered.some(
        (entry) => entry.type.endsWith(":Target") && entry.name.includes("libretranslate"),
      ),
    ).toBe(false);
  });

  it("returns the region's endpoints", () => {
    expect(stack.endpoints.map((endpoint) => endpoint.tool)).toEqual([
      "nominatim",
      "retrieval-embed",
    ]);
  });

  it("refuses a region on another cloud", () => {
    expect(() => awsToolsStack(PLAN, "ksa")).toThrow(/only the AWS tools stack is built/);
  });
});
