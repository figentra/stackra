/**
 * Stackra file contract:
 * Purpose: unit tests of `gcpRuntime` under Pulumi's mocks: production's Cloud SQL server keeps its backups in its own
 *          region with point-in-time recovery, a standby, deletion protection and a private IP on the resolved VPC;
 *          a passed data key encrypts it after the Cloud SQL agent is granted the key; a server without a VPC is
 *          reachable only over TLS through the connector; pgaudit sets its flags and routes its entries into a log bucket
 *          in the region, and is absent when off; the slow-statement flags follow `slowQueryMs`; no database means no
 *          instance; a Valkey cache becomes a Memorystore instance on the VPC with its connection policy, encrypted in
 *          transit with IAM sign-in, and stands without a database.
 * Boundary: test only; no engine and no cloud call (ADR 0171: agents never apply a stack).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0186, ADR 0238, ADR 0401.
 */
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
    version: "POSTGRES_17",
    highAvailability: true,
    retainedBackups: 35,
    pitr: { days: 7 },
    pgaudit: { log: ["ddl", "role"], retentionDays: 400 },
    slowQueryMs: 1000,
    network: "ref:gcp.network.prod",
  },
  cache: null,
};

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
      databaseVersion: "POSTGRES_17",
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
