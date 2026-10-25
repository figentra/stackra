/**
 * Stackra file contract:
 * Purpose: unit tests of `r2Bucket`: the Turborepo cache bucket with its 7-day expiry rule (in seconds, every prefix),
 *          and a bucket without an expiry gets no lifecycle.
 * Boundary: test only; Pulumi under mocks, so no provider or cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0026, ADR 0171 (decisions 6 and 7).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { r2Bucket } from "#node/functions/r2-bucket.function";
import {
  declaredAs,
  mockPulumi,
  settled,
  type DeclaredResource,
} from "#node/functions/__tests__/fixtures/pulumi-mocks.fixture";

let declared: DeclaredResource[];

beforeEach(async () => {
  declared = await mockPulumi();
});

describe("r2Bucket", () => {
  it("expires the Turborepo cache after 7 days", async () => {
    await settled(r2Bucket({ accountId: "acc-1", name: "turbo-cache", expireDays: 7 }));

    expect(declaredAs(declared, "cloudflare:index/r2Bucket:R2Bucket")[0]?.inputs).toEqual({
      accountId: "acc-1",
      name: "turbo-cache",
    });
    expect(
      declaredAs(declared, "cloudflare:index/r2BucketLifecycle:R2BucketLifecycle")[0]?.inputs,
    ).toEqual({
      accountId: "acc-1",
      bucketName: "turbo-cache",
      rules: [
        {
          id: "expire-after-7-days",
          enabled: true,
          conditions: { prefix: "" },
          deleteObjectsTransition: { condition: { type: "Age", maxAge: 604_800 } },
        },
      ],
    });
  });

  it("keeps objects when the bucket has no expiry", async () => {
    const bucket = r2Bucket({ accountId: "acc-1", name: "downloads" });
    await settled(bucket);

    expect(bucket.lifecycle).toBeUndefined();
    expect(declared.map((resource) => resource.type)).toEqual([
      "cloudflare:index/r2Bucket:R2Bucket",
    ]);
  });
});
