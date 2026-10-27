/**
 * Stackra file contract:
 * Purpose: unit tests of `turboCache`: the bucket with its 7-day expiry rule and the Worker's custom domain on the
 *          given host; no domain without a host; an expiry that is not a whole positive number of days is refused.
 * Boundary: test only; Pulumi under mocks, so no provider or cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0026; ADR 0171 (decision 6).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import {
  declaredAs,
  mockPulumi,
  settled,
  type DeclaredResource,
} from "#node/functions/__tests__/fixtures/pulumi-mocks.fixture";
import { turboCache } from "#node/turbo-cache/functions/turbo-cache.function";

let declared: DeclaredResource[];

beforeEach(async () => {
  declared = await mockPulumi();
});

describe("turboCache", () => {
  it("declares the bucket, its 7-day expiry and the Worker's custom domain", async () => {
    await settled(
      turboCache({
        accountId: "acc-1",
        bucket: "turbo-cache",
        expireDays: 7,
        script: "stackra-turbo-cache",
        domain: { hostname: "turbo.stackra.figentra.com", zoneId: "zone-1" },
      }),
    );

    expect(declaredAs(declared, "cloudflare:index/r2Bucket:R2Bucket")[0]?.inputs).toEqual({
      accountId: "acc-1",
      name: "turbo-cache",
    });
    expect(
      declaredAs(declared, "cloudflare:index/r2BucketLifecycle:R2BucketLifecycle")[0]?.inputs,
    ).toMatchObject({
      bucketName: "turbo-cache",
      rules: [{ deleteObjectsTransition: { condition: { type: "Age", maxAge: 604_800 } } }],
    });
    expect(
      declaredAs(declared, "cloudflare:index/workersCustomDomain:WorkersCustomDomain"),
    ).toEqual([
      {
        type: "cloudflare:index/workersCustomDomain:WorkersCustomDomain",
        name: "turbo-cache-turbo.stackra.figentra.com",
        inputs: {
          accountId: "acc-1",
          hostname: "turbo.stackra.figentra.com",
          service: "stackra-turbo-cache",
          zoneId: "zone-1",
        },
        importId: undefined,
      },
    ]);
  });

  it("declares no domain without a host", async () => {
    const cache = turboCache({
      accountId: "acc-1",
      bucket: "turbo-cache",
      expireDays: 7,
      script: "stackra-turbo-cache",
    });
    await settled(cache);

    expect(cache.customDomain).toBeUndefined();
    expect(
      declaredAs(declared, "cloudflare:index/workersCustomDomain:WorkersCustomDomain"),
    ).toEqual([]);
  });

  it.each([0, -1, 1.5])("refuses expireDays %d", (expireDays) => {
    expect(() =>
      turboCache({ accountId: "acc-1", bucket: "turbo-cache", expireDays, script: "s" }),
    ).toThrow(RangeError);
  });
});
