/**
 * Stackra file contract:
 * Purpose: unit tests of `databaseBackups` under Pulumi's mocks: the encrypted vault, the service role with both
 *          AWS Backup policies, a continuous point-in-time rule only when retention is set, the daily snapshot copied
 *          to the backup account's vault, and a selection that narrows to the environment's tag when asked.
 * Boundary: test only; no engine and no cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171 (the foundation), ADR 0172 (backups to a second account).
 */
import * as pulumi from "@pulumi/pulumi";
import { describe, expect, it } from "@stackra/testing";

import { databaseBackups } from "#node/functions/database-backups.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";

const COPY_TO = "arn:aws:backup:me-central-1:999999999999:backup-vault:acme-backup";

/** The arguments; `pitrDays` and `byTag` vary. */
function argsWith(pitrDays: number | null, byTag: boolean) {
  return {
    environment: "staging",
    keyArn: pulumi.output("arn:aws:kms:me-central-1:111111111111:key/k"),
    database: { pitrDays, snapshotDays: 35 },
    copyTo: COPY_TO,
    byTag,
    roleName: "acme-staging-backup",
  };
}

describe("databaseBackups", () => {
  it("encrypts the vault and gives AWS Backup a role with its two service policies", async () => {
    const engine = await mockPulumi();
    databaseBackups("acme", argsWith(7, false), {});

    expect((await engine.find("Vault", "acme")).inputs["kmsKeyArn"]).toBe(
      "arn:aws:kms:me-central-1:111111111111:key/k",
    );
    expect((await engine.find("Role", "acme-backup")).inputs["name"]).toBe("acme-staging-backup");
    for (const purpose of ["backup", "restores"])
      expect(
        (await engine.find("RolePolicyAttachment", `acme-backup-${purpose}`)).inputs["policyArn"],
      ).toMatch(/service-role\/AWSBackupServiceRolePolicyFor/);
  });

  it("adds a continuous rule for the retention and copies the daily snapshot to the backup vault", async () => {
    const engine = await mockPulumi();
    databaseBackups("acme", argsWith(7, false), {});

    const rules = (await engine.find("Plan", "acme")).inputs["rules"] as Record<string, unknown>[];
    expect(rules.map((rule) => rule["ruleName"])).toEqual(["point-in-time", "snapshot"]);
    expect(rules[0]).toMatchObject({ enableContinuousBackup: true, lifecycle: { deleteAfter: 7 } });
    expect(rules[1]).toMatchObject({
      lifecycle: { deleteAfter: 1 },
      copyActions: [{ destinationVaultArn: COPY_TO, lifecycle: { deleteAfter: 35 } }],
    });
  });

  it("skips the point-in-time rule when retention is off", async () => {
    const engine = await mockPulumi();
    databaseBackups("acme", argsWith(null, false), {});

    const rules = (await engine.find("Plan", "acme")).inputs["rules"] as Record<string, unknown>[];
    expect(rules.map((rule) => rule["ruleName"])).toEqual(["snapshot"]);
  });

  it("selects every database, or only this environment's tag when asked", async () => {
    const all = await mockPulumi();
    databaseBackups("acme", argsWith(7, false), {});
    const everything = (await all.find("Selection", "acme")).inputs;
    expect(everything["resources"]).toEqual(["arn:aws:rds:*:*:db:*", "arn:aws:rds:*:*:cluster:*"]);
    expect(everything["conditions"]).toBeUndefined();

    const tagged = await mockPulumi();
    databaseBackups("acme", argsWith(7, true), {});
    expect((await tagged.find("Selection", "acme")).inputs).toMatchObject({
      name: "staging-postgres",
      conditions: [{ stringEquals: [{ key: "aws:ResourceTag/env", value: "staging" }] }],
    });
  });
});
