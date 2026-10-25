/**
 * Stackra file contract:
 * Purpose: unit tests of `filesBucket` under Pulumi's mocks: the storage service agent may use the data key; the
 *          bucket is private, regional, versioned and on that key, with the media CORS rule and the upload and
 *          replaced-version expiry; no origins means no CORS rule and no expiry days means no version rule.
 * Boundary: test only; no engine and no cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0222, ADR 0186 (decision 3), ADR 0354.
 */
import * as pulumi from "@pulumi/pulumi";
import { describe, expect, it } from "@stackra/testing";

import { filesBucket } from "#node/functions/files-bucket.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";
import { outputOf } from "#testing/functions/output-of.function";

/** The arguments; `files` varies. */
function argsWith(files: { expireNoncurrentDays: number | null; origins: string[] }) {
  return {
    project: "acme-stg",
    projectNumber: "42",
    region: "europe-west3",
    keyId: pulumi.output("key-id"),
    files: { versioning: true, ...files },
  };
}

describe("filesBucket", () => {
  it("makes a private, versioned bucket on the data key with CORS and expiry", async () => {
    const engine = await mockPulumi();
    const bucket = filesBucket(
      "acme-staging-files",
      argsWith({ expireNoncurrentDays: 30, origins: ["https://console.staging.acme.example"] }),
      {},
    );

    expect((await engine.find("CryptoKeyIAMMember", "acme-staging-files-agent")).inputs).toEqual({
      cryptoKeyId: "key-id",
      role: "roles/cloudkms.cryptoKeyEncrypterDecrypter",
      member: "serviceAccount:service-42@gs-project-accounts.iam.gserviceaccount.com",
    });
    const recorded = await engine.find("gcp:storage/bucket:Bucket", "acme-staging-files");
    expect(recorded.inputs).toMatchObject({
      project: "acme-stg",
      location: "europe-west3",
      uniformBucketLevelAccess: true,
      publicAccessPrevention: "enforced",
      versioning: { enabled: true },
      encryption: { defaultKmsKeyName: "key-id" },
      cors: [
        {
          methods: ["PUT"],
          origins: ["https://console.staging.acme.example"],
          responseHeaders: ["content-type", "x-amz-meta-*"],
        },
      ],
    });
    expect(recorded.inputs["lifecycleRules"]).toEqual([
      { action: { type: "Delete" }, condition: { age: 1, matchesPrefixes: ["uploads/"] } },
      {
        action: { type: "Delete" },
        condition: { daysSinceNoncurrentTime: 30, withState: "ARCHIVED" },
      },
    ]);
    expect(await outputOf(bucket.name)).toBe("acme-staging-files");
  });

  it("adds no CORS rule without origins and no version rule without days", async () => {
    const engine = await mockPulumi();
    filesBucket("acme-staging-files", argsWith({ expireNoncurrentDays: null, origins: [] }), {});

    const recorded = await engine.find("Bucket", "acme-staging-files");
    expect(recorded.inputs["cors"]).toEqual([]);
    expect(recorded.inputs["lifecycleRules"]).toHaveLength(1);
  });
});
