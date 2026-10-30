/**
 * Stackra file contract:
 * Purpose: unit tests of `awsWorkloads` under Pulumi's mocks: a workload's Fargate task reads its own secrets and the
 *          variables of the resources it uses from the environment's SSM parameters, by name only; every workload is
 *          registered in the private namespace; a public workload gets an ALB admitting HTTPS from Cloudflare only,
 *          a TLS 1.3 listener on the given certificate, a target group checking its health path, and CPU autoscaling
 *          between its bounds; an internal one gets none of them; a public workload without a certificate is refused.
 * Boundary: test only; no cloud is called and no state is written (`pulumi.runtime.setMocks`).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0493 (decisions 2 and 4, owner answers Q5 and Q6); spec sta-1640.
 */
import * as pulumi from "@pulumi/pulumi";
import { beforeAll, describe, expect, it } from "@stackra/testing";

import type { RuntimePlan } from "#core/types/runtime-plan.type";
import type { WorkloadPlan } from "#core/types/workload-plan.type";
import { awsWorkloads } from "#node/functions/aws-workloads.function";

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
    public: isPublic,
    env: { ZITADEL_EXTERNALSECURE: "true" },
    secrets: isPublic ? ["ZITADEL_MASTERKEY"] : [],
    uses: isPublic ? ["main-db"] : [],
    cpu: 1024,
    memoryMb: 2048,
    scale,
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
      version: "17",
      instanceClass: "db.r7g.large",
      multiAz: true,
      storageGb: 100,
      backupDays: 14,
      consumers: ["zitadel"],
      tags: { env: "production", service: "main-db" },
    },
  ],
  workloads: [
    workload("zitadel", true, { min: 2, max: 4 }),
    workload("ocr", false, { min: 1, max: 1 }),
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
      ]),
    );
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
