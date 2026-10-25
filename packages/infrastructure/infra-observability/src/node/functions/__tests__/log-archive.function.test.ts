/**
 * Stackra file contract:
 * Purpose: unit tests of `logArchive`: a private, encrypted bucket that refuses plain HTTP and expires objects after
 *          the full calendar months, and one user whose policy reaches that bucket only, with its access key.
 * Boundary: test only; Pulumi under mocks, so no provider or cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0184 (decision 5), ADR 0173.
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import {
  declaredAs,
  mockPulumi,
  settled,
  type DeclaredResource,
} from "#node/functions/__tests__/fixtures/pulumi-mocks.fixture";
import { logArchive } from "#node/functions/log-archive.function";

let declared: DeclaredResource[];

beforeEach(async () => {
  declared = await mockPulumi();
});

/** The inputs of the one resource of `type`. */
const only = (type: string) => declaredAs(declared, type)[0]?.inputs;

describe("logArchive", () => {
  it("keeps logs in a private bucket for 13 calendar months", async () => {
    await settled(logArchive("logs-archive-acme-platform", 13));

    expect(only("aws:s3/bucketPublicAccessBlock:BucketPublicAccessBlock")).toEqual({
      bucket: "logs-archive-acme-platform-id",
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
    expect(
      only(
        "aws:s3/bucketServerSideEncryptionConfiguration:BucketServerSideEncryptionConfiguration",
      ),
    ).toEqual({
      bucket: "logs-archive-acme-platform-id",
      rules: [{ applyServerSideEncryptionByDefault: { sseAlgorithm: "AES256" } }],
    });
    expect(only("aws:s3/bucketLifecycleConfiguration:BucketLifecycleConfiguration")).toEqual({
      bucket: "logs-archive-acme-platform-id",
      rules: [
        {
          id: "expire-after-13-months",
          status: "Enabled",
          filter: {},
          expiration: { days: 396 },
        },
      ],
    });
    const bucketPolicy = JSON.parse(String(only("aws:s3/bucketPolicy:BucketPolicy")?.["policy"]));
    expect(bucketPolicy.Statement).toEqual([
      {
        Sid: "DenyPlainHttp",
        Effect: "Deny",
        Principal: "*",
        Action: "s3:*",
        Resource: [
          "arn:aws:s3:::logs-archive-acme-platform",
          "arn:aws:s3:::logs-archive-acme-platform/*",
        ],
        Condition: { Bool: { "aws:SecureTransport": "false" } },
      },
    ]);
  });

  it("lets one user reach that bucket and nothing else", async () => {
    await settled(logArchive("logs-archive-acme-platform", 13));

    const userPolicy = JSON.parse(String(only("aws:iam/userPolicy:UserPolicy")?.["policy"]));
    expect(userPolicy.Statement).toEqual([
      {
        Effect: "Allow",
        Action: "s3:ListBucket",
        Resource: "arn:aws:s3:::logs-archive-acme-platform",
      },
      {
        Effect: "Allow",
        Action: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
        Resource: "arn:aws:s3:::logs-archive-acme-platform/*",
      },
    ]);
    expect(only("aws:iam/accessKey:AccessKey")).toEqual({ user: "logs-archive-acme-platform" });
  });
});
