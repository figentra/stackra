/**
 * Stackra file contract:
 * Purpose: unit tests of the resource secrets (ADR 0493 decision 4): `resourceVariables` derives `MAIN_DB_URL` and its
 *          siblings; `consumerVariables` gives each consumer the names of the resources it uses; `ensureDatabasePasswords`
 *          reuses the job's password, or generates one and writes it blind to `<env>:/runtime/<resource>` first;
 *          `publishResourceSecrets` writes host, port, user and a TLS URL there, refuses a database without an applied
 *          endpoint, and never puts a password in a name or path.
 * Boundary: test only; the memory `VaultWriter` keeps names only, and no Pulumi program runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0493 (decision 4); spec sta-1640.
 */
import type * as pulumi from "@pulumi/pulumi";
import { describe, expect, it } from "@stackra/testing";
import { VaultWriter } from "@stackra/runway";

import { consumerVariables } from "#core/functions/consumer-variables.function";
import { resourceVariables } from "#core/functions/resource-variables.function";
import type { RuntimePlan } from "#core/types/runtime-plan.type";
import { ensureDatabasePasswords } from "#node/functions/ensure-database-passwords.function";
import { publishResourceSecrets } from "#node/functions/publish-resource-secrets.function";

/** A vault that records each write's path, name and value length (never the value). */
class RecordingVault extends VaultWriter {
  readonly writes: { path: string; name: string; length: number; value: string }[] = [];

  override async write(path: string, name: string, value: string): Promise<void> {
    this.writes.push({ path, name, length: value.length, value });
  }
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
      consumers: ["identity", "zitadel"],
      tags: { env: "production", service: "main-db" },
    },
  ],
  workloads: [],
  cost: { items: [], monthlyUsd: 0 },
};

/** The value a Pulumi output resolves to. */
function valueOf(output: pulumi.Output<string> | undefined): Promise<string> {
  if (output === undefined) throw new Error("No output");
  return new Promise((resolve) => {
    output.apply(resolve);
  });
}

describe("resource secrets", () => {
  // @covers sta-1640:FR-010
  it("derives each resource's variable names and each consumer's", () => {
    expect(resourceVariables("main-db")).toEqual({
      url: "MAIN_DB_URL",
      host: "MAIN_DB_HOST",
      port: "MAIN_DB_PORT",
      user: "MAIN_DB_USER",
      password: "MAIN_DB_PASSWORD",
    });
    expect(consumerVariables(PLAN)["zitadel"]).toEqual([
      "MAIN_DB_HOST",
      "MAIN_DB_PASSWORD",
      "MAIN_DB_PORT",
      "MAIN_DB_URL",
      "MAIN_DB_USER",
    ]);
  });

  // @covers sta-1640:FR-010
  it("reuses the job's password and writes nothing", async () => {
    const vault = new RecordingVault();
    const passwords = await ensureDatabasePasswords(PLAN, {
      vault,
      env: { MAIN_DB_PASSWORD: "kept-password" },
      vaultEnvironment: "prod",
    });

    expect(vault.writes).toEqual([]);
    expect(await valueOf(passwords["resources.main-db"])).toBe("kept-password");
  });

  // @covers sta-1640:FR-010
  it("generates a password the first time and writes it blind before use", async () => {
    const vault = new RecordingVault();
    const passwords = await ensureDatabasePasswords(PLAN, {
      vault,
      env: {},
      vaultEnvironment: "prod",
    });

    expect(vault.writes.map(({ path, name, length }) => ({ path, name, length }))).toEqual([
      { path: "prod:/runtime/main-db", name: "MAIN_DB_PASSWORD", length: 43 },
    ]);
    expect(await valueOf(passwords["resources.main-db"])).toBe(vault.writes[0]?.value);
  });

  // @covers sta-1640:FR-010
  it("publishes host, port, user and a TLS URL after apply", async () => {
    const vault = new RecordingVault();
    const written = await publishResourceSecrets(PLAN, {
      vault,
      vaultEnvironment: "prod",
      endpoints: { "resources.main-db": { host: "main-db.proxy.example", port: 5432 } },
      passwords: { "resources.main-db": "p@ss/word" },
    });

    expect(written).toEqual({
      "main-db": ["MAIN_DB_HOST", "MAIN_DB_PORT", "MAIN_DB_USER", "MAIN_DB_URL"],
    });
    expect(vault.writes.find((entry) => entry.name === "MAIN_DB_URL")?.value).toBe(
      "postgres://stackra_admin:p%40ss%2Fword@main-db.proxy.example:5432/postgres?sslmode=require",
    );
    for (const entry of vault.writes) {
      expect(entry.path).toBe("prod:/runtime/main-db");
      expect(entry.name).not.toContain("p@ss");
    }
  });

  it("refuses a database without an applied endpoint", async () => {
    await expect(
      publishResourceSecrets(PLAN, {
        vault: new RecordingVault(),
        vaultEnvironment: "prod",
        endpoints: {},
        passwords: {},
      }),
    ).rejects.toThrow(/No applied endpoint/);
  });
});
