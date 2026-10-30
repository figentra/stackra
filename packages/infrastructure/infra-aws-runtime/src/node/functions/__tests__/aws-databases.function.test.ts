/**
 * Stackra file contract:
 * Purpose: unit tests of `awsDatabases` under Pulumi's mocks: a dev RDS database is encrypted, private, sized from the
 *          plan, throwaway (no deletion protection, no final snapshot) and admits port 5432 only from the runtime's
 *          security groups; a production Aurora database gets two instances, deletion protection and a final
 *          snapshot; each gets RDS Proxy with TLS required, logging in through a Secrets Manager secret; the proxy
 *          endpoint is returned; a plan with a database but no VPC or no password input is refused.
 * Boundary: test only; no cloud is called and no state is written (`pulumi.runtime.setMocks`).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0493 (decisions 2 and 4); ADR 0473; ADR 0186; spec sta-1640.
 */
import * as pulumi from "@pulumi/pulumi";
import { beforeAll, describe, expect, it } from "@stackra/testing";

import type { DatabasePlan } from "#core/types/database-plan.type";
import type { RuntimePlan } from "#core/types/runtime-plan.type";
import { awsDatabases } from "#node/functions/aws-databases.function";

/** One resource the program registered. */
type Registered = {
  readonly type: string;
  readonly name: string;
  readonly inputs: Record<string, unknown>;
};

const registered: Registered[] = [];

/** A database of `environment` on `engine`. */
function database(environment: string, engine: "rds" | "aurora", multiAz: boolean): DatabasePlan {
  return {
    key: "resources.main-db",
    resource: "main-db",
    name: `academorix-${environment}-main-db`,
    engine,
    version: engine === "rds" ? "17" : "17.4",
    instanceClass: multiAz ? "db.r7g.large" : "db.t4g.micro",
    multiAz,
    storageGb: 20,
    backupDays: 14,
    consumers: ["identity"],
    tags: { env: environment, service: "main-db" },
  };
}

/** A plan of `environment` holding `databases`. */
function plan(environment: "dev" | "production", databases: DatabasePlan[]): RuntimePlan {
  return {
    project: "academorix",
    environment,
    queues: [],
    caches: [],
    buckets: [],
    databases,
    workloads: [],
    cost: { items: [], monthlyUsd: 0 },
  };
}

const NETWORK = {
  subnetIds: ["subnet-a", "subnet-b"],
  securityGroupIds: ["sg-runtime"],
  vpcId: "vpc-1",
};

/** The registered resource whose type ends in `:<kind>` and whose logical name is `name`. */
function resource(kind: string, name: string): Registered {
  const found = registered.find((entry) => entry.type.endsWith(`:${kind}`) && entry.name === name);
  if (found === undefined) throw new Error(`No ${kind} named ${name} was registered`);
  return found;
}

/** The value `output` resolves to. */
function valueOf<T>(output: pulumi.Output<T>): Promise<T> {
  return new Promise((resolve) => {
    output.apply(resolve);
  });
}

let endpoint: string;

beforeAll(async () => {
  await pulumi.runtime.setMocks(
    {
      newResource: (args) => {
        const inputs = args.inputs as Record<string, unknown>;
        registered.push({ type: args.type, name: args.name, inputs });
        return {
          id: `${args.name}-id`,
          state: { ...inputs, arn: `arn:mock:${args.name}`, endpoint: `${args.name}.proxy.mock` },
        };
      },
      call: (args) => args.inputs as Record<string, unknown>,
    },
    "infra-aws-runtime",
    "dev",
    false,
  );
  const dev = awsDatabases(plan("dev", [database("dev", "rds", false)]), {
    network: NETWORK,
    databasePasswords: { "resources.main-db": pulumi.secret("password-canary") },
  });
  awsDatabases(plan("production", [database("production", "aurora", true)]), {
    network: NETWORK,
    databasePasswords: { "resources.main-db": pulumi.secret("password-canary") },
  });
  const out = dev["resources.main-db"];
  if (out === undefined) throw new Error("No database output");
  endpoint = await valueOf(out.endpoint);
  let count = -1;
  while (count !== registered.length) {
    count = registered.length;
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
  }
});

describe("awsDatabases", () => {
  // @covers sta-1640:FR-007
  it("declares a private, encrypted, throwaway dev RDS database open only to the runtime", () => {
    const instance = resource("Instance", "academorix-dev-main-db").inputs;
    expect(instance).toMatchObject({
      engine: "postgres",
      engineVersion: "17",
      instanceClass: "db.t4g.micro",
      multiAz: false,
      publiclyAccessible: false,
      storageEncrypted: true,
      backupRetentionPeriod: 14,
      deletionProtection: false,
      skipFinalSnapshot: true,
    });
    const group = resource("SecurityGroup", "academorix-dev-main-db").inputs;
    expect(group["ingress"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fromPort: 5432, securityGroups: ["sg-runtime"] }),
      ]),
    );
  });

  // @covers sta-1640:FR-007
  it("declares a protected production Aurora cluster with two instances", () => {
    expect(resource("Cluster", "academorix-production-main-db").inputs).toMatchObject({
      engine: "aurora-postgresql",
      deletionProtection: true,
      finalSnapshotIdentifier: "academorix-production-main-db-final",
    });
    expect(resource("ClusterInstance", "academorix-production-main-db-1").inputs).toMatchObject({
      instanceClass: "db.r7g.large",
    });
  });

  // @covers sta-1640:FR-007
  it("puts RDS Proxy with TLS in front and returns its endpoint", () => {
    expect(resource("Proxy", "academorix-dev-main-db-proxy").inputs).toMatchObject({
      engineFamily: "POSTGRESQL",
      requireTls: true,
    });
    expect(endpoint).toBe("academorix-dev-main-db-proxy.proxy.mock");
  });

  // @covers sta-1640:FR-010
  it("keeps the password out of every tag and name", () => {
    for (const entry of registered) {
      expect(JSON.stringify(entry.inputs["tags"] ?? {})).not.toContain("password-canary");
      expect(entry.name).not.toContain("password-canary");
    }
  });

  it("refuses a database without a VPC or a password", () => {
    const one = plan("dev", [database("dev", "rds", false)]);
    expect(() =>
      awsDatabases(one, {
        network: { subnetIds: [], securityGroupIds: [] },
        databasePasswords: {},
      }),
    ).toThrow(/vpcId/);
    expect(() => awsDatabases(one, { network: NETWORK })).toThrow(/No password input/);
  });
});
