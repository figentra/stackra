/**
 * Stackra file contract:
 * Purpose: unit tests of `gcpRuntime` under Pulumi's mocks: production's Cloud SQL server keeps its backups in its own
 *          region with point-in-time recovery, a standby, deletion protection and a private IP on the resolved VPC;
 *          a passed data key encrypts it after the Cloud SQL agent is granted the key; a server without a VPC is
 *          reachable only over TLS through the connector; no database means no instance.
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
    network: "ref:gcp.network.prod",
  },
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

  it("creates no instance without a database", async () => {
    const engine = await mockPulumi();
    const runtime = gcpRuntime({ ...PRODUCTION, database: null });
    const types = (await engine.settled()).map((resource) => resource.type.split(":").at(-1));
    expect(types).not.toContain("DatabaseInstance");
    expect(runtime).toEqual({ databaseInstance: null, databaseConnection: null });
  });
});
