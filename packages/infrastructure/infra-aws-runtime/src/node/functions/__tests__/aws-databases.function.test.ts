/**
 * Stackra file contract:
 * Purpose: unit tests of `awsDatabases` under Pulumi's mocks: a dev RDS database is encrypted, private, sized from the
 *          plan, throwaway (no deletion protection, no final snapshot) and admits port 5432 only from the runtime's
 *          security groups; a production Aurora database gets two instances, deletion protection and a final
 *          snapshot; each gets RDS Proxy with TLS required, logging in through a Secrets Manager secret; the proxy
 *          endpoint is returned; a database that preloads extensions gets a parameter group (a cluster one on Aurora)
 *          of its engine's family setting `shared_preload_libraries` at the next reboot; a database that names
 *          extensions gets one create-extension run per revision: a Fargate task in its own outbound-only security
 *          group, which the database admits, running `createExtensionsScript` with the admin login (the password read
 *          from the proxy's secret, never in the task) against the instance or cluster endpoint once the server and
 *          the secret exist, handed back by resource name for what must follow it; a database without extensions
 *          gets no such run; a plan with a database but no VPC or no password input is refused.
 * Boundary: test only; no cloud is called and no state is written (`pulumi.runtime.setMocks`); `dynamic.Resource` is
 *           mocked so the extensions run registers without closure serialisation, keeping its options.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0493 (decisions 2 and 4); ADR 0473; ADR 0186; spec sta-1640;
 *                     ADR 0160 (notes of 2026-11-03 and 2026-11-26).
 */
import * as pulumi from "@pulumi/pulumi";
import { beforeAll, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import type { DatabasePlan } from "#core/types/database-plan.type";
import type { RuntimePlan } from "#core/types/runtime-plan.type";
import { awsDatabases } from "#node/functions/aws-databases.function";

/** Each dynamic resource's name and the resources it was told to wait for. */
const runs = vi.hoisted((): { name: string; dependsOn: unknown }[] => []);

// Vitest rewrites the provider's code, so Pulumi's closure serialisation of it never settles under the mocks; the
// dynamic resource registers here without its serialised provider, and keeps what it depends on.
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
      runs.push({ name, dependsOn: opts?.dependsOn });
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

/** A database of `environment` on `engine`, naming `extensions`. */
function database(
  environment: string,
  engine: "rds" | "aurora",
  multiAz: boolean,
  extensions: DatabasePlan["extensions"] = ["pg_stat_statements", "vector"],
): DatabasePlan {
  return {
    key: "resources.main-db",
    resource: "main-db",
    name: `academorix-${environment}-main-db`,
    engine,
    version: engine === "rds" ? "18" : "18.3",
    instanceClass: multiAz ? "db.r7g.large" : "db.t4g.micro",
    multiAz,
    storageGb: 20,
    backupDays: 14,
    consumers: ["identity"],
    extensions,
    preloadLibraries: extensions.filter((extension) => extension === "pg_stat_statements"),
    tags: { env: environment, service: "main-db" },
  };
}

/** A plan of `environment` holding `databases`. */
function plan(
  environment: "dev" | "staging" | "production",
  databases: DatabasePlan[],
): RuntimePlan {
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

/** What the dev database's extensions run is handed back under. */
const ready = new Map<string, pulumi.Resource>();

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
            endpoint: `${args.name}.proxy.mock`,
            address: `${args.name}.rds.mock`,
          },
        };
      },
      call: (args) => args.inputs as Record<string, unknown>,
    },
    "infra-aws-runtime",
    "dev",
    false,
  );
  const dev = awsDatabases(
    plan("dev", [database("dev", "rds", false)]),
    {
      network: NETWORK,
      databasePasswords: { "resources.main-db": pulumi.secret("password-canary") },
    },
    [],
    ready,
  );
  awsDatabases(plan("staging", [database("staging", "rds", false, [])]), {
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
      engineVersion: "18",
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

  it("preloads pg_stat_statements through a parameter group of the engine's family", () => {
    const preload = {
      parameters: [
        {
          name: "shared_preload_libraries",
          value: "pg_stat_statements",
          applyMethod: "pending-reboot",
        },
      ],
    };
    expect(resource("ParameterGroup", "academorix-dev-main-db").inputs).toMatchObject({
      family: "postgres18",
      ...preload,
    });
    expect(resource("Instance", "academorix-dev-main-db").inputs).toMatchObject({
      parameterGroupName: "academorix-dev-main-db",
    });
    expect(resource("ClusterParameterGroup", "academorix-production-main-db").inputs).toMatchObject(
      {
        family: "aurora-postgresql18",
        ...preload,
      },
    );
    expect(resource("Cluster", "academorix-production-main-db").inputs).toMatchObject({
      dbClusterParameterGroupName: "academorix-production-main-db",
    });
  });

  it("creates the planned extensions with the admin login, the password read from the proxy's secret", () => {
    const task = resource("TaskDefinition", "academorix-dev-main-db-extensions").inputs;
    expect(task).toMatchObject({
      family: "academorix-dev-main-db-extensions",
      networkMode: "awsvpc",
      requiresCompatibilities: ["FARGATE"],
      executionRoleArn: "arn:mock:academorix-dev-db-setup-execution",
    });
    const definitions = String(task["containerDefinitions"]);
    expect(definitions).not.toContain("password-canary");
    const [container] = JSON.parse(definitions) as {
      name: string;
      image: string;
      command: string[];
      environment: { name: string; value: string }[];
      secrets: { name: string; valueFrom: string }[];
    }[];
    expect(container?.name).toBe("extensions");
    expect(container?.image).toBe("postgres:18.6-alpine");
    expect(container?.command.slice(0, 2)).toEqual(["sh", "-c"]);
    expect(container?.command[2]).toContain('CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";');
    expect(container?.command[2]).toContain('CREATE EXTENSION IF NOT EXISTS "vector";');
    expect(container?.environment).toEqual(
      expect.arrayContaining([
        { name: "PGHOST", value: "academorix-dev-main-db.rds.mock" },
        { name: "PGUSER", value: "stackra_admin" },
        { name: "PGSSLMODE", value: "require" },
      ]),
    );
    expect(container?.secrets).toEqual([
      { name: "PGPASSWORD", valueFrom: "arn:mock:academorix-dev-main-db:password::" },
    ]);
    // Only the setup role reads the secret.
    expect(
      String(resource("RolePolicy", "academorix-dev-main-db-extensions").inputs["policy"]),
    ).toContain("arn:mock:academorix-dev-main-db");
  });

  it("runs it once per revision from its own security group, which the database admits", () => {
    expect(resource("Resource", "academorix-dev-main-db-extensions").inputs).toMatchObject({
      name: "academorix-dev-main-db",
      purpose: "extensions",
      cluster: "arn:mock:academorix-dev-db-setup",
      taskDefinition: "arn:mock:academorix-dev-main-db-extensions",
      container: "extensions",
      subnets: ["subnet-a", "subnet-b"],
      securityGroups: ["academorix-dev-db-setup-id"],
      timeoutMinutes: 10,
    });
    expect(resource("SecurityGroup", "academorix-dev-db-setup").inputs).toMatchObject({
      vpcId: "vpc-1",
      ingress: [],
    });
    expect(resource("SecurityGroup", "academorix-dev-main-db").inputs["ingress"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fromPort: 5432, securityGroups: ["academorix-dev-db-setup-id"] }),
      ]),
    );
  });

  it("waits for the server and the secret, and hands the run back by resource name", async () => {
    const run = runs.find((entry) => entry.name === "academorix-dev-main-db-extensions");
    const names = await Promise.all(
      ((run?.dependsOn ?? []) as pulumi.Resource[]).map((dependency) =>
        valueOf(dependency.urn).then((urn) => urn.split("::").at(-1)),
      ),
    );
    expect(names).toEqual(expect.arrayContaining(["academorix-dev-main-db"]));
    expect(names.length).toBeGreaterThanOrEqual(4);
    const handed = ready.get("main-db");
    expect(handed === undefined ? undefined : await valueOf(handed.urn)).toContain(
      "academorix-dev-main-db-extensions",
    );
    // Aurora signs in at the cluster endpoint once its instances exist.
    const aurora = runs.find((entry) => entry.name === "academorix-production-main-db-extensions");
    expect(aurora).toBeDefined();
  });

  it("gives a database without extensions no run and its environment no setup", () => {
    expect(
      registered.filter(
        (entry) =>
          entry.name === "academorix-staging-main-db-extensions" ||
          entry.name.startsWith("academorix-staging-db-setup"),
      ),
    ).toEqual([]);
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
