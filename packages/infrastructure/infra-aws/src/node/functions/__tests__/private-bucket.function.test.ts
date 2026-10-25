/**
 * Stackra file contract:
 * Purpose: unit tests of `privateBucket` under Pulumi's mocks: KMS encryption with the bucket key, a full public
 *          access block, a policy that refuses plain HTTP beside the caller's statements, versioning and lifecycle
 *          only when asked, and the versioning resource handed back for a replication to wait on.
 * Boundary: test only; no engine and no cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171 (the foundation), ADR 0172.
 */
import { describe, expect, it } from "@stackra/testing";

import { privateBucket } from "#node/functions/private-bucket.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";

describe("privateBucket", () => {
  it("encrypts with the key, blocks public access and refuses plain HTTP", async () => {
    const engine = await mockPulumi();
    privateBucket(
      "acme",
      {
        bucket: "acme-fixed",
        keyArn: "arn:aws:kms:me-central-1:1:key/k",
        versioning: false,
        lifecycle: [],
        statements: (arn) => [{ Sid: "Extra", Effect: "Allow", Resource: arn }],
      },
      {},
    );

    expect((await engine.find("Bucket", "acme")).inputs).toEqual({ bucket: "acme-fixed" });
    expect(
      (await engine.find("BucketServerSideEncryptionConfiguration", "acme")).inputs["rules"],
    ).toEqual([
      {
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: "aws:kms",
          kmsMasterKeyId: "arn:aws:kms:me-central-1:1:key/k",
        },
        bucketKeyEnabled: true,
      },
    ]);
    expect((await engine.find("BucketPublicAccessBlock", "acme")).inputs).toMatchObject({
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
    const policy = JSON.parse(
      (await engine.find("BucketPolicy", "acme")).inputs["policy"] as string,
    ) as { Statement: Record<string, unknown>[] };
    expect(policy.Statement.map((statement) => statement["Sid"])).toEqual([
      "DenyPlainHttp",
      "Extra",
    ]);
    expect(policy.Statement[0]).toMatchObject({
      Effect: "Deny",
      Condition: { Bool: { "aws:SecureTransport": "false" } },
    });
  });

  it("creates no versioning and no lifecycle unless asked", async () => {
    const engine = await mockPulumi();
    const { versioning } = privateBucket(
      "acme",
      { keyArn: "k", versioning: false, lifecycle: [], statements: () => [] },
      {},
    );
    const types = (await engine.settled()).map((resource) => resource.type.split(":").at(-1));

    expect(versioning).toBeNull();
    expect(types).not.toContain("BucketVersioning");
    expect(types).not.toContain("BucketLifecycleConfiguration");
  });

  it("versions the bucket and applies the lifecycle rules when asked", async () => {
    const engine = await mockPulumi();
    const lifecycle = [{ id: "old", status: "Enabled", filter: {}, expiration: { days: 7 } }];
    const { versioning } = privateBucket(
      "acme",
      { keyArn: "k", versioning: true, lifecycle, statements: () => [] },
      {},
    );

    expect(versioning).not.toBeNull();
    expect((await engine.find("BucketVersioning", "acme")).inputs).toMatchObject({
      versioningConfiguration: { status: "Enabled" },
    });
    expect((await engine.find("BucketLifecycleConfiguration", "acme")).inputs["rules"]).toEqual(
      lifecycle,
    );
  });
});
