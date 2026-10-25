/**
 * Stackra file contract:
 * Purpose: unit tests of `filesBucket` under Pulumi's mocks: the unclaimed-upload expiry and the optional
 *          noncurrent-version expiry, the media CORS rule only when there are origins, and replication to the backup
 *          account (a role the S3 service assumes from this account, its permissions and the replication rule) only
 *          when a replica is given and versioning is on.
 * Boundary: test only; no engine and no cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171 (the foundation), ADR 0172; the @stackra/media README.
 */
import * as pulumi from "@pulumi/pulumi";
import { describe, expect, it } from "@stackra/testing";

import type { BackupTargets } from "#node/types/backup-targets.type";
import { filesBucket } from "#node/functions/files-bucket.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";

/** The arguments of a files bucket; each test overrides what it varies. */
function argsWith(overrides: Partial<Parameters<typeof filesBucket>[1]> = {}) {
  return {
    account: "111111111111",
    region: "me-central-1",
    keyArn: pulumi.output("arn:aws:kms:me-central-1:111111111111:key/k"),
    files: { versioning: true, expireNoncurrentDays: null, origins: [] as string[] },
    replica: null,
    replicationRole: "acme-staging-replication",
    ...overrides,
  };
}

/** The backup account's replication targets. */
const REPLICA: { account: string; targets: BackupTargets } = {
  account: "999999999999",
  targets: {
    vaultName: "acme-backup",
    vaultArn: "arn:aws:backup:me-central-1:999999999999:backup-vault:acme-backup",
    bucketName: "acme-backup-999999999999",
    bucketArn: "arn:aws:s3:::acme-backup-999999999999",
    keyAlias: "alias/acme-backup",
    keyAliasArn: "arn:aws:kms:me-central-1:999999999999:alias/acme-backup",
  },
};

describe("filesBucket", () => {
  it("expires unclaimed uploads after a day and replaced versions when asked", async () => {
    const engine = await mockPulumi();
    filesBucket(
      "acme-files",
      argsWith({ files: { versioning: true, expireNoncurrentDays: 30, origins: [] } }),
      {},
    );

    expect(
      (await engine.find("BucketLifecycleConfiguration", "acme-files")).inputs["rules"],
    ).toEqual([
      {
        id: "unclaimed-uploads",
        status: "Enabled",
        filter: { prefix: "uploads/" },
        expiration: { days: 1 },
      },
      {
        id: "replaced-versions",
        status: "Enabled",
        filter: {},
        noncurrentVersionExpiration: { noncurrentDays: 30 },
      },
    ]);
  });

  it("opens PUT to the upload origins only when there are any", async () => {
    const engine = await mockPulumi();
    filesBucket(
      "acme-files",
      argsWith({
        files: {
          versioning: false,
          expireNoncurrentDays: null,
          origins: ["https://app.acme.test"],
        },
      }),
      {},
    );

    expect(
      (await engine.find("BucketCorsConfiguration", "acme-files")).inputs["corsRules"],
    ).toEqual([
      {
        allowedMethods: ["PUT"],
        allowedOrigins: ["https://app.acme.test"],
        allowedHeaders: ["content-type", "x-amz-meta-*"],
        maxAgeSeconds: 3600,
      },
    ]);
  });

  it("creates neither CORS nor replication without origins or a replica", async () => {
    const engine = await mockPulumi();
    filesBucket("acme-files", argsWith(), {});
    const types = (await engine.settled()).map((resource) => resource.type.split(":").at(-1));

    expect(types).not.toContain("BucketCorsConfiguration");
    expect(types).not.toContain("BucketReplicationConfig");
  });

  it("replicates to the backup account under a role only this account's S3 can assume", async () => {
    const engine = await mockPulumi();
    filesBucket("acme-files", argsWith({ replica: REPLICA }), {});

    const role = await engine.find("Role", "acme-files-replication");
    expect(role.inputs["name"]).toBe("acme-staging-replication");
    expect(JSON.parse(role.inputs["assumeRolePolicy"] as string).Statement[0]).toMatchObject({
      Principal: { Service: "s3.amazonaws.com" },
      Condition: { StringEquals: { "aws:SourceAccount": "111111111111" } },
    });
    const rule = (await engine.find("BucketReplicationConfig", "acme-files")).inputs["rules"] as {
      destination: Record<string, unknown>;
    }[];
    expect(rule[0]?.destination).toMatchObject({
      bucket: REPLICA.targets.bucketArn,
      account: "999999999999",
      accessControlTranslation: { owner: "Destination" },
      encryptionConfiguration: { replicaKmsKeyId: REPLICA.targets.keyAliasArn },
    });
    const permissions = JSON.parse(
      (await engine.find("RolePolicy", "acme-files-replication")).inputs["policy"] as string,
    ) as { Statement: { Action: unknown }[] };
    expect(permissions.Statement.map((statement) => statement.Action)).toContainEqual(
      "kms:Decrypt",
    );
  });

  it("does not replicate a bucket that is not versioned", async () => {
    const engine = await mockPulumi();
    filesBucket(
      "acme-files",
      argsWith({
        replica: REPLICA,
        files: { versioning: false, expireNoncurrentDays: null, origins: [] },
      }),
      {},
    );
    const types = (await engine.settled()).map((resource) => resource.type.split(":").at(-1));

    expect(types).not.toContain("BucketReplicationConfig");
  });
});
