/**
 * Stackra file contract:
 * Purpose: unit tests of `gcpRuntime` under Pulumi's mocks: production's Cloud SQL server keeps its backups in its own
 *          region with point-in-time recovery, a standby, deletion protection and a private IP on the resolved VPC;
 *          a passed data key encrypts it after the Cloud SQL agent is granted the key; a server without a VPC is
 *          reachable only over TLS through the connector; pgaudit sets its flags and routes its entries into a log bucket
 *          in the region, and is absent when off; the slow-statement flags follow `slowQueryMs`; no database means no
 *          instance; a Valkey cache becomes a Memorystore instance on the VPC with its connection policy, encrypted in
 *          transit with IAM sign-in, and stands without a database; planned extensions get an admin user, its password
 *          in an in-region secret only the job's account reads, and a Cloud Run job run inside the apply that creates
 *          them over the private network with TLS (or through the connector socket on a server without a VPC), again
 *          only when the extensions change; without extensions none of that exists, and extensions without an admin
 *          password are refused.
 * Boundary: test only; no engine and no cloud call (ADR 0171: agents never apply a stack).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0186, ADR 0238, ADR 0401; ADR 0160 (note of 2026-11-26).
 */
import * as pulumi from "@pulumi/pulumi";
import { describe, expect, it } from "@stackra/testing";

import type { GcpRuntimeConfig } from "#core/types/gcp-runtime-config.type";
import { gcpRuntime } from "#node/functions/gcp-runtime.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";
import { outputOf } from "#testing/functions/output-of.function";

/** Production in KSA with a sized database. */
const PRODUCTION: GcpRuntimeConfig = {
  project: "acme",
  environment: "production",
  deployment: "acme-production",
  dedicated: null,
  projectKey: "prod",
  cloudProject: { id: "acme-prod", number: "123456789012" },
  region: "me-central2",
  ownsProject: true,
  labels: { project: "acme", env: "production", service: "infra-gcp" },
  database: {
    tier: "db-custom-2-7680",
    version: "POSTGRES_18",
    highAvailability: true,
    retainedBackups: 35,
    pitr: { days: 7 },
    pgaudit: { log: ["ddl", "role"], retentionDays: 400 },
    slowQueryMs: 1000,
    network: "ref:gcp.network.prod",
    extensions: [],
  },
  cache: null,
};

/** Production whose services name `extensions`, on its VPC or (`network: null`) through the connector. */
function withExtensions(
  extensions: NonNullable<GcpRuntimeConfig["database"]>["extensions"],
  network: string | null = "ref:gcp.network.prod",
): GcpRuntimeConfig {
  const database = PRODUCTION.database as NonNullable<GcpRuntimeConfig["database"]>;
  return { ...PRODUCTION, database: { ...database, extensions, network } };
}

/** The extensions job's one container, as registered. */
type JobContainer = {
  image: string;
  commands: string[];
  args: string[];
  envs: { name: string; value?: string; valueSource?: unknown }[];
  volumeMounts?: unknown;
};

/** The registered extensions job's inputs and its container. */
async function jobOf(engine: Awaited<ReturnType<typeof mockPulumi>>) {
  const job = (await engine.find("Job", "acme-production-extensions")).inputs;
  const template = (job["template"] as { template: Record<string, unknown> }).template;
  const [container] = template["containers"] as JobContainer[];
  return { job, template, container };
}

/** The shared Valkey cache production declares in the cache tests. */
const CACHE: NonNullable<GcpRuntimeConfig["cache"]> = {
  node: "STANDARD_SMALL",
  shards: 1,
  replicas: 1,
  eviction: "allkeys-lru",
  auth: "iam",
  network: "ref:gcp.network.prod",
  subnet: "ref:gcp.subnet.prod",
};

/** The extensions job's run token for production on its VPC with `extensions`. */
async function tokenOf(
  extensions: NonNullable<GcpRuntimeConfig["database"]>["extensions"],
): Promise<unknown> {
  const engine = await mockPulumi({ gcp: { network: { prod: "net" } } });
  gcpRuntime(withExtensions(extensions), { adminPassword: pulumi.secret("p") });
  return (await jobOf(engine)).job["runExecutionToken"];
}

describe("gcpRuntime", () => {
  it("keeps backups in the region with point-in-time recovery on a private network", async () => {
    const engine = await mockPulumi({
      gcp: { network: { prod: "projects/acme-prod/global/networks/main" } },
    });
    const runtime = gcpRuntime(PRODUCTION);

    expect(
      (await engine.find("DatabaseInstance", "acme-production-postgres")).inputs,
    ).toMatchObject({
      project: "acme-prod",
      region: "me-central2",
      databaseVersion: "POSTGRES_18",
      deletionProtection: true,
      settings: {
        tier: "db-custom-2-7680",
        availabilityType: "REGIONAL",
        deletionProtectionEnabled: true,
        backupConfiguration: {
          enabled: true,
          location: "me-central2",
          pointInTimeRecoveryEnabled: true,
          transactionLogRetentionDays: 7,
          backupRetentionSettings: { retainedBackups: 35, retentionUnit: "COUNT" },
        },
        ipConfiguration: {
          ipv4Enabled: false,
          privateNetwork: "projects/acme-prod/global/networks/main",
          sslMode: "ENCRYPTED_ONLY",
        },
      },
    });
    expect(
      await outputOf(runtime.databaseInstance as NonNullable<typeof runtime.databaseInstance>),
    ).toBe("acme-production-postgres");
  });

  it("encrypts with the data key after granting it to the Cloud SQL agent", async () => {
    const engine = await mockPulumi({ gcp: { network: { prod: "net" } } });
    gcpRuntime(PRODUCTION, {
      keyId: "projects/acme-prod/locations/me-central2/keyRings/r/cryptoKeys/data",
    });

    expect(
      (await engine.find("ServiceIdentity", "acme-production-sql-agent")).inputs["service"],
    ).toBe("sqladmin.googleapis.com");
    expect(
      (await engine.find("CryptoKeyIAMMember", "acme-production-sql-key")).inputs["role"],
    ).toBe("roles/cloudkms.cryptoKeyEncrypterDecrypter");
    expect(
      (await engine.find("DatabaseInstance", "acme-production-postgres")).inputs[
        "encryptionKeyName"
      ],
    ).toBe("projects/acme-prod/locations/me-central2/keyRings/r/cryptoKeys/data");
  });

  it("reaches a server without a VPC only through the connector, with Cloud SQL's default backups", async () => {
    const engine = await mockPulumi();
    const database = { ...(PRODUCTION.database as NonNullable<GcpRuntimeConfig["database"]>) };
    gcpRuntime({
      ...PRODUCTION,
      database: {
        ...database,
        network: null,
        pitr: false,
        retainedBackups: null,
        highAvailability: false,
      },
    });

    const settings = (await engine.find("DatabaseInstance", "acme-production-postgres")).inputs[
      "settings"
    ] as Record<string, unknown>;
    expect(settings["availabilityType"]).toBe("ZONAL");
    expect(settings["backupConfiguration"]).toEqual({
      enabled: true,
      location: "me-central2",
      pointInTimeRecoveryEnabled: false,
    });
    expect(settings["ipConfiguration"]).toEqual({
      ipv4Enabled: true,
      sslMode: "ENCRYPTED_ONLY",
      authorizedNetworks: [],
    });
  });

  it("creates the planned extensions with an admin login over the private network, inside the apply", async () => {
    const engine = await mockPulumi({
      gcp: { network: { prod: "projects/acme-prod/global/networks/main" } },
    });
    gcpRuntime(withExtensions(["pg_trgm", "vector"]), {
      adminPassword: pulumi.secret("password-canary"),
      subnet: "projects/acme-prod/regions/me-central2/subnetworks/run",
    });

    expect((await engine.find("User", "acme-production-admin")).inputs).toMatchObject({
      project: "acme-prod",
      instance: "acme-production-postgres",
      name: "stackra_admin",
      deletionPolicy: "ABANDON",
    });
    expect((await engine.find("Secret", "acme-production-db-admin")).inputs).toMatchObject({
      secretId: "acme-production-db-admin",
      replication: { userManaged: { replicas: [{ location: "me-central2" }] } },
    });
    expect((await engine.find("Account", "acme-production-dbext")).inputs["accountId"]).toBe(
      "acme-production-dbext",
    );
    expect(
      (await engine.find("SecretIamMember", "acme-production-db-admin-reader")).inputs,
    ).toMatchObject({
      secretId: "acme-production-db-admin",
      role: "roles/secretmanager.secretAccessor",
      member: "serviceAccount:acme-production-dbext@mock.iam.gserviceaccount.com",
    });

    const { job, template, container } = await jobOf(engine);
    expect(job).toMatchObject({ location: "me-central2", name: "acme-production-extensions" });
    expect(job["runExecutionToken"]).toMatch(/^[0-9a-f]{12}$/);
    expect(template).toMatchObject({
      serviceAccount: "acme-production-dbext@mock.iam.gserviceaccount.com",
      maxRetries: 0,
      vpcAccess: {
        egress: "PRIVATE_RANGES_ONLY",
        networkInterfaces: [
          {
            network: "projects/acme-prod/global/networks/main",
            subnetwork: "projects/acme-prod/regions/me-central2/subnetworks/run",
          },
        ],
      },
    });
    expect(container?.image).toBe("docker.io/library/postgres:18.6-alpine");
    expect(container?.commands).toEqual(["sh", "-c"]);
    expect(container?.args[0]).toContain('CREATE EXTENSION IF NOT EXISTS "pg_trgm";');
    expect(container?.args[0]).toContain('CREATE EXTENSION IF NOT EXISTS "vector";');
    expect(container?.envs).toEqual(
      expect.arrayContaining([
        { name: "PGUSER", value: "stackra_admin" },
        { name: "PGSSLMODE", value: "require" },
        {
          name: "PGPASSWORD",
          valueSource: {
            secretKeyRef: expect.objectContaining({ secret: "acme-production-db-admin" }),
          },
        },
      ]),
    );
    // The job only names the secret: the password reaches the user and the secret, nothing else.
    expect(JSON.stringify(job)).not.toContain("password-canary");
    const types = (await engine.settled()).map((resource) => resource.type.split(":").at(-1));
    expect(types).not.toContain("IAMMember");
  });

  it("reaches a server without a VPC through the Cloud SQL connector socket", async () => {
    const engine = await mockPulumi();
    gcpRuntime(withExtensions(["citext"], null), {
      adminPassword: pulumi.secret("password-canary"),
    });

    const { template, container } = await jobOf(engine);
    // The mocks leave the connection name unresolved; the volume names the instance's connection.
    expect(template["volumes"]).toMatchObject([{ name: "cloudsql", cloudSqlInstance: {} }]);
    expect(template).not.toHaveProperty("vpcAccess");
    expect(container?.volumeMounts).toEqual([{ name: "cloudsql", mountPath: "/cloudsql" }]);
    expect(container?.envs.find((env) => env.name === "PGHOST")?.value).toMatch(/^\/cloudsql\//);
    expect(container?.envs.map((env) => env.name)).not.toContain("PGSSLMODE");
    expect(
      (await engine.find("IAMMember", "acme-production-dbext-sql-client")).inputs["role"],
    ).toBe("roles/cloudsql.client");
  });

  it("runs the job again only when the extensions change", async () => {
    const first = await tokenOf(["pg_trgm"]);
    expect(await tokenOf(["pg_trgm"])).toBe(first);
    expect(await tokenOf(["pg_trgm", "vector"])).not.toBe(first);
  });

  it("creates no login, secret or job when no service names an extension", async () => {
    const engine = await mockPulumi({ gcp: { network: { prod: "net" } } });
    gcpRuntime(PRODUCTION);

    const types = (await engine.settled()).map((resource) => resource.type.split(":").at(-1));
    for (const type of ["User", "Secret", "SecretVersion", "Account", "Job"])
      expect(types).not.toContain(type);
  });

  it("refuses planned extensions without an admin password", async () => {
    await mockPulumi({ gcp: { network: { prod: "net" } } });
    expect(() => gcpRuntime(withExtensions(["vector"]))).toThrow(/pass adminPassword/);
  });

  it("switches pgaudit on and routes its entries into a log bucket in the region", async () => {
    const engine = await mockPulumi({ gcp: { network: { prod: "net" } } });
    gcpRuntime(PRODUCTION);

    const settings = (await engine.find("DatabaseInstance", "acme-production-postgres")).inputs[
      "settings"
    ] as Record<string, unknown>;
    expect(settings["databaseFlags"]).toEqual([
      { name: "cloudsql.enable_pgaudit", value: "on" },
      { name: "pgaudit.log", value: "ddl,role" },
      { name: "log_min_duration_statement", value: "1000" },
      { name: "cloudsql.enable_auto_explain", value: "on" },
      { name: "auto_explain.log_min_duration", value: "1000" },
    ]);
    expect(
      (await engine.find("ProjectBucketConfig", "acme-production-pgaudit")).inputs,
    ).toMatchObject({
      project: "acme-prod",
      location: "me-central2",
      bucketId: "acme-production-pgaudit",
      retentionDays: 400,
    });
    const sink = (await engine.find("ProjectSink", "acme-production-pgaudit")).inputs;
    expect(sink["destination"]).toBe(
      "logging.googleapis.com/projects/acme-prod/locations/me-central2/buckets/acme-production-pgaudit",
    );
    expect(sink["filter"]).toContain('resource.type="cloudsql_database"');
    expect(sink["filter"]).toContain("google.cloud.sql.audit.v1.PgAuditEntry");
  });

  it("sets no pgaudit flag, bucket or sink when the runway turns it off", async () => {
    const engine = await mockPulumi({ gcp: { network: { prod: "net" } } });
    const database = { ...(PRODUCTION.database as NonNullable<GcpRuntimeConfig["database"]>) };
    gcpRuntime({ ...PRODUCTION, database: { ...database, pgaudit: false, slowQueryMs: false } });

    const settings = (await engine.find("DatabaseInstance", "acme-production-postgres")).inputs[
      "settings"
    ] as Record<string, unknown>;
    expect(settings["databaseFlags"]).toBeUndefined();
    const types = (await engine.settled()).map((resource) => resource.type.split(":").at(-1));
    expect(types).not.toContain("ProjectBucketConfig");
    expect(types).not.toContain("ProjectSink");
  });

  it("keeps the slow-statement flags when only pgaudit is off (STA-1400)", async () => {
    const engine = await mockPulumi({ gcp: { network: { prod: "net" } } });
    const database = { ...(PRODUCTION.database as NonNullable<GcpRuntimeConfig["database"]>) };
    gcpRuntime({ ...PRODUCTION, database: { ...database, pgaudit: false, slowQueryMs: 300 } });

    const settings = (await engine.find("DatabaseInstance", "acme-production-postgres")).inputs[
      "settings"
    ] as Record<string, unknown>;
    expect(settings["databaseFlags"]).toEqual([
      { name: "log_min_duration_statement", value: "300" },
      { name: "cloudsql.enable_auto_explain", value: "on" },
      { name: "auto_explain.log_min_duration", value: "300" },
    ]);
  });

  it("creates no instance without a database", async () => {
    const engine = await mockPulumi();
    const runtime = gcpRuntime({ ...PRODUCTION, database: null });
    const types = (await engine.settled()).map((resource) => resource.type.split(":").at(-1));
    expect(types).not.toContain("DatabaseInstance");
    expect(runtime).toEqual({
      databaseInstance: null,
      databaseConnection: null,
      cacheInstance: null,
      cacheEndpoint: null,
    });
  });

  it("puts the Valkey cache on the VPC, encrypted in transit with IAM sign-in, after its connection policy", async () => {
    const engine = await mockPulumi({
      gcp: {
        network: { prod: "projects/acme-prod/global/networks/main" },
        subnet: { prod: "projects/acme-prod/regions/me-central2/subnetworks/psc" },
      },
    });
    const runtime = gcpRuntime({ ...PRODUCTION, cache: CACHE });

    expect(
      (await engine.find("ServiceConnectionPolicy", "acme-production-cache-psc")).inputs,
    ).toMatchObject({
      project: "acme-prod",
      location: "me-central2",
      serviceClass: "gcp-memorystore",
      network: "projects/acme-prod/global/networks/main",
      pscConfig: { subnetworks: ["projects/acme-prod/regions/me-central2/subnetworks/psc"] },
    });
    expect((await engine.find("Instance", "acme-production-cache")).inputs).toMatchObject({
      project: "acme-prod",
      location: "me-central2",
      instanceId: "acme-production-cache",
      nodeType: "STANDARD_SMALL",
      shardCount: 1,
      replicaCount: 1,
      mode: "CLUSTER_DISABLED",
      zoneDistributionConfig: { mode: "MULTI_ZONE" },
      transitEncryptionMode: "SERVER_AUTHENTICATION",
      authorizationMode: "IAM_AUTH",
      deletionProtectionEnabled: true,
      engineConfigs: { "maxmemory-policy": "allkeys-lru" },
      desiredAutoCreatedEndpoints: [
        { network: "projects/acme-prod/global/networks/main", projectId: "acme-prod" },
      ],
    });
    expect(runtime.cacheInstance).not.toBeNull();
  });

  it("runs a cluster past one shard, uses the VPC's own policy without a subnet, and stands without a database", async () => {
    const engine = await mockPulumi({ gcp: { network: { prod: "net" } } });
    const runtime = gcpRuntime({
      ...PRODUCTION,
      database: null,
      cache: { ...CACHE, shards: 3, replicas: 0, eviction: null, auth: "none", subnet: null },
    });

    const inputs = (await engine.find("Instance", "acme-production-cache")).inputs;
    expect(inputs).toMatchObject({
      mode: "CLUSTER",
      shardCount: 3,
      zoneDistributionConfig: { mode: "SINGLE_ZONE" },
      authorizationMode: "AUTH_DISABLED",
    });
    expect(inputs["engineConfigs"]).toBeUndefined();
    const types = (await engine.settled()).map((resource) => resource.type.split(":").at(-1));
    expect(types).not.toContain("ServiceConnectionPolicy");
    expect(types).not.toContain("DatabaseInstance");
    expect(runtime.databaseInstance).toBeNull();
    expect(runtime.cacheInstance).not.toBeNull();
  });
});
