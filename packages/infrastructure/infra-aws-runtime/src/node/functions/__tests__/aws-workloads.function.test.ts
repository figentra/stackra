/**
 * Stackra file contract:
 * Purpose: unit tests of `awsWorkloads` under Pulumi's mocks: a workload's Fargate task reads its own secrets and the
 *          variables of the resources it uses from the environment's SSM parameters, by name only, also under each
 *          alias, and starts with its own arguments (none for an image's default); every workload is
 *          registered in the private namespace; a public workload gets an ALB admitting HTTPS from Cloudflare only,
 *          a TLS 1.3 listener on the given certificate, a target group checking its health path, and CPU autoscaling
 *          between its bounds; an internal one gets none of them; a worker with no port gets no port mapping and its
 *          health command as the container's health check; a public workload without a certificate is refused; a
 *          workload with `migrate` gets a migration task (the same image and secrets, its own arguments, no port) and
 *          one migration run of that revision with its timeout, and a workload without one gets neither.
 * Boundary: test only; no cloud is called and no state is written (`pulumi.runtime.setMocks`); `dynamic.Resource` is
 *           mocked so the migration run registers without closure serialisation.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0493 (decisions 2 and 4, owner answers Q5 and Q6); spec sta-1640.
 */
import * as pulumi from "@pulumi/pulumi";
import { beforeAll, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import type { RuntimePlan } from "#core/types/runtime-plan.type";
import type { WorkloadPlan } from "#core/types/workload-plan.type";
import { awsWorkloads } from "#node/functions/aws-workloads.function";

// Vitest rewrites the provider's code, so Pulumi's closure serialisation of it never settles under the mocks; the
// dynamic resource registers here without its serialised provider.
vi.mock("@pulumi/pulumi", async (original) => {
  const actual = await original<typeof pulumi>();
  class Resource extends actual.CustomResource {
    constructor(
      _provider: unknown,
      name: string,
      props: pulumi.Inputs,
      opts?: pulumi.CustomResourceOptions,
    ) {
      super("pulumi-nodejs:dynamic:Resource", name, props, opts);
    }
  }
  return { ...actual, dynamic: { ...actual.dynamic, Resource } };
});

/** One resource the program registered. */
type Registered = {
  readonly type: string;
  readonly name: string;
  readonly inputs: Record<string, unknown>;
};

const registered: Registered[] = [];

const DIGEST = `ghcr.io/zitadel/zitadel@sha256:${"c".repeat(64)}`;

/** A workload named `name`. */
function workload(
  name: string,
  isPublic: boolean,
  scale: { min: number; max: number },
): WorkloadPlan {
  return {
    key: `workloads.${name}`,
    workload: name,
    name: `academorix-production-${name}`,
    image: DIGEST,
    port: 8080,
    health: "/debug/healthz",
    healthCommand: [],
    command: isPublic ? ["start-from-init", "--masterkeyFromEnv", "--tlsMode", "external"] : [],
    ...(isPublic
      ? { migrate: { command: ["setup", "--masterkeyFromEnv"], timeoutMinutes: 20 } }
      : {}),
    public: isPublic,
    env: { ZITADEL_EXTERNALSECURE: "true" },
    secrets: isPublic ? ["ZITADEL_MASTERKEY"] : [],
    uses: isPublic ? ["main-db"] : [],
    aliases: isPublic ? { ZITADEL_DATABASE_POSTGRES_DSN: "MAIN_DB_URL" } : {},
    cpu: 1024,
    memoryMb: 2048,
    scale,
    tags: { env: "production", service: name },
  };
}

/** A queue worker named `name`: no port, checked by `healthCommand`. */
function worker(name: string, healthCommand: readonly string[]): WorkloadPlan {
  return {
    key: `workloads.${name}`,
    workload: name,
    name: `academorix-production-${name}`,
    image: DIGEST,
    healthCommand,
    command: [],
    public: false,
    env: {},
    secrets: [],
    uses: [],
    aliases: {},
    cpu: 512,
    memoryMb: 1024,
    scale: { min: 1, max: 1 },
    tags: { env: "production", service: name },
  };
}

const PLAN: RuntimePlan = {
  project: "academorix",
  environment: "production",
  queues: [],
  caches: [],
  buckets: [],
  databases: [
    {
      key: "resources.main-db",
      resource: "main-db",
      name: "academorix-production-main-db",
      engine: "rds",
      version: "18",
      instanceClass: "db.r7g.large",
      multiAz: true,
      storageGb: 100,
      backupDays: 14,
      consumers: ["zitadel"],
      extensions: [],
      preloadLibraries: [],
      tags: { env: "production", service: "main-db" },
    },
  ],
  workloads: [
    workload("zitadel", true, { min: 2, max: 4 }),
    workload("ocr", false, { min: 1, max: 1 }),
    worker("sidekiq", ["pgrep", "-f", "sidekiq"]),
  ],
  cost: { items: [], monthlyUsd: 0 },
};

const OPTIONS = {
  network: { subnetIds: ["subnet-a"], securityGroupIds: ["sg-runtime"], vpcId: "vpc-1" },
  workloads: { publicSubnetIds: ["subnet-public"], certificateArn: "arn:aws:acm:mock:cert" },
};

/** Every registered resource whose type ends in `:<kind>`. */
function all(kind: string): Registered[] {
  return registered.filter((entry) => entry.type.endsWith(`:${kind}`));
}

/** The registered resource whose type ends in `:<kind>` and whose logical name is `name`. */
function resource(kind: string, name: string): Registered {
  const found = registered.find((entry) => entry.type.endsWith(`:${kind}`) && entry.name === name);
  if (found === undefined) throw new Error(`No ${kind} named ${name} was registered`);
  return found;
}

let hosts: { internal: string; public: string | undefined };

beforeAll(async () => {
  await pulumi.runtime.setMocks(
    {
      newResource: (args) => {
        const inputs = args.inputs as Record<string, unknown>;
        registered.push({ type: args.type, name: args.name, inputs });
        return {
          id: `${args.name}-id`,
          state: { ...inputs, arn: `arn:mock:${args.name}`, dnsName: `${args.name}.elb.mock` },
        };
      },
      call: (args) => ({
        ...(args.inputs as Record<string, unknown>),
        name: "me-central-1",
        accountId: "123",
      }),
    },
    "infra-aws-runtime",
    "production",
    false,
  );
  const out = awsWorkloads(PLAN, OPTIONS, "sg-workloads");
  const zitadel = out["workloads.zitadel"];
  if (zitadel?.publicHost === undefined) throw new Error("No public host");
  hosts = {
    internal: zitadel.internalHost,
    public: await new Promise((resolve) => {
      zitadel.publicHost?.apply(resolve);
    }),
  };
  let count = -1;
  while (count !== registered.length) {
    count = registered.length;
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
  }
});

describe("awsWorkloads", () => {
  // @covers sta-1640:FR-009
  // @covers sta-1640:FR-010
  it("reads the workload's own secrets and its resources' variables from SSM by name", () => {
    const task = resource("TaskDefinition", "academorix-production-zitadel").inputs;
    const [container] = JSON.parse(String(task["containerDefinitions"])) as {
      secrets: { name: string; valueFrom: string }[];
      image: string;
      command?: string[];
    }[];

    expect(task).toMatchObject({
      requiresCompatibilities: ["FARGATE"],
      cpu: "1024",
      memory: "2048",
    });
    expect(container?.image).toBe(DIGEST);
    expect(container?.secrets).toEqual(
      expect.arrayContaining([
        {
          name: "ZITADEL_MASTERKEY",
          valueFrom: "/academorix/production/workloads/zitadel/ZITADEL_MASTERKEY",
        },
        { name: "MAIN_DB_URL", valueFrom: "/academorix/production/runtime/main-db/MAIN_DB_URL" },
        {
          name: "ZITADEL_DATABASE_POSTGRES_DSN",
          valueFrom: "/academorix/production/runtime/main-db/MAIN_DB_URL",
        },
      ]),
    );
    expect(container?.command).toEqual([
      "start-from-init",
      "--masterkeyFromEnv",
      "--tlsMode",
      "external",
    ]);
  });

  // @covers sta-1640:FR-009
  it("leaves an image's default command when the workload names no arguments", () => {
    const task = resource("TaskDefinition", "academorix-production-ocr").inputs;
    const [container] = JSON.parse(String(task["containerDefinitions"])) as { command?: unknown }[];

    expect(container).not.toHaveProperty("command");
  });

  it("gives a worker with no port no port mapping and its health command as the container's check", () => {
    const task = resource("TaskDefinition", "academorix-production-sidekiq").inputs;
    const [container] = JSON.parse(String(task["containerDefinitions"])) as Record<
      string,
      unknown
    >[];
    const ocr = resource("TaskDefinition", "academorix-production-ocr").inputs;
    const [served] = JSON.parse(String(ocr["containerDefinitions"])) as Record<string, unknown>[];

    expect(container).not.toHaveProperty("portMappings");
    expect(container?.["healthCheck"]).toMatchObject({
      command: ["CMD", "pgrep", "-f", "sidekiq"],
    });
    expect(served).not.toHaveProperty("healthCheck");
    expect(served?.["portMappings"]).toEqual([{ containerPort: 8080, protocol: "tcp" }]);
    expect(all("TargetGroup").map((group) => group.name)).not.toContain(
      "academorix-production-sidekiq",
    );
  });

  it("runs a workload's migration as its own task, once per revision, before the service", () => {
    const task = resource("TaskDefinition", "academorix-production-zitadel-migrate").inputs;
    const [container] = JSON.parse(String(task["containerDefinitions"])) as {
      name: string;
      image: string;
      command?: string[];
      portMappings?: unknown;
      secrets: { name: string }[];
    }[];

    expect(task).toMatchObject({ family: "academorix-production-zitadel-migrate", cpu: "1024" });
    expect(container).toMatchObject({
      name: "zitadel",
      image: DIGEST,
      command: ["setup", "--masterkeyFromEnv"],
    });
    expect(container).not.toHaveProperty("portMappings");
    expect(container?.secrets.map((secret) => secret.name)).toEqual(
      expect.arrayContaining(["ZITADEL_MASTERKEY", "ZITADEL_DATABASE_POSTGRES_DSN"]),
    );
    expect(resource("Resource", "academorix-production-zitadel-migrate").inputs).toMatchObject({
      name: "academorix-production-zitadel",
      taskDefinition: "arn:mock:academorix-production-zitadel-migrate",
      container: "zitadel",
      subnets: ["subnet-a"],
      securityGroups: ["sg-workloads"],
      timeoutMinutes: 20,
    });
  });

  it("gives a workload without migrate no migration task and no run", () => {
    expect(
      registered.filter((entry) => entry.name === "academorix-production-ocr-migrate"),
    ).toEqual([]);
  });

  // @covers sta-1640:FR-009
  it("puts a public workload behind an HTTPS ALB open to Cloudflare only, with autoscaling", () => {
    const group = resource("SecurityGroup", "academorix-production-workloads-alb").inputs;
    const [rule] = group["ingress"] as { cidrBlocks: string[]; fromPort: number }[];
    expect(rule?.fromPort).toBe(443);
    expect(rule?.cidrBlocks).toContain("104.16.0.0/13");

    expect(resource("Listener", "academorix-production-zitadel").inputs).toMatchObject({
      protocol: "HTTPS",
      certificateArn: "arn:aws:acm:mock:cert",
    });
    expect(resource("TargetGroup", "academorix-production-zitadel").inputs).toMatchObject({
      healthCheck: { path: "/debug/healthz" },
      targetType: "ip",
    });
    expect(resource("Target", "academorix-production-zitadel").inputs).toMatchObject({
      minCapacity: 2,
      maxCapacity: 4,
    });
    expect(hosts.public).toBe("academorix-production-zitadel.elb.mock");
    expect(hosts.internal).toBe("zitadel.production.workloads.academorix.internal");
  });

  // @covers sta-1640:FR-009
  it("gives an internal workload discovery only: no load balancer and no autoscaling", () => {
    const ecs = registered.find(
      (entry) =>
        entry.type === "aws:ecs/service:Service" && entry.name === "academorix-production-ocr",
    );
    expect(ecs?.inputs).toMatchObject({
      desiredCount: 1,
      launchType: "FARGATE",
    });
    expect(all("LoadBalancer").map((entry) => entry.name)).toEqual([
      "academorix-production-zitadel",
    ]);
    // a streamed answer (60 to 120 s) outlives the ALB's default 60 s idle timeout
    expect(all("LoadBalancer")[0]?.inputs).toMatchObject({ idleTimeout: 180 });
    expect(all("Target").map((entry) => entry.name)).toEqual(["academorix-production-zitadel"]);
  });

  it("refuses a public workload without a certificate", () => {
    expect(() =>
      awsWorkloads(
        PLAN,
        { network: OPTIONS.network, workloads: { publicSubnetIds: ["subnet-public"] } },
        "sg",
      ),
    ).toThrow(/certificateArn/);
  });
});
