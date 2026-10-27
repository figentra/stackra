/**
 * Stackra file contract:
 * Purpose: unit tests of `registryWorker`: the R2 bucket, the D1 database, the KV namespace and the custom domain
 *          with ADR 0453's names, and the adoption of an existing custom domain by import id.
 * Boundary: test only; Pulumi under mocks, so no provider or cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decisions 1 to 3).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import {
  declaredAs,
  inputsByName,
  mockPulumi,
  settled,
  type DeclaredResource,
} from "#node/functions/__tests__/fixtures/pulumi-mocks.fixture";
import { registryWorker } from "#node/registry/registry-worker.function";

let declared: DeclaredResource[];

const ARGS = {
  accountId: "acc-1",
  zoneId: "zone-fig",
  hostname: "npm.stackra.figentra.com",
  script: "stackra-registry",
  bucket: "stackra-registry",
  database: "stackra-registry",
  namespace: "stackra-registry-cache",
};

beforeEach(async () => {
  declared = await mockPulumi();
});

describe("registryWorker", () => {
  it("declares the bucket, database, namespace and custom domain", async () => {
    await settled(registryWorker(ARGS));

    expect(inputsByName(declared, "cloudflare:index/r2Bucket:R2Bucket")).toEqual({
      "r2-stackra-registry": { accountId: "acc-1", name: "stackra-registry" },
    });
    expect(inputsByName(declared, "cloudflare:index/d1Database:D1Database")).toEqual({
      "d1-stackra-registry": { accountId: "acc-1", name: "stackra-registry" },
    });
    expect(
      inputsByName(declared, "cloudflare:index/workersKvNamespace:WorkersKvNamespace"),
    ).toEqual({
      "kv-stackra-registry-cache": { accountId: "acc-1", title: "stackra-registry-cache" },
    });
    expect(
      inputsByName(declared, "cloudflare:index/workersCustomDomain:WorkersCustomDomain"),
    ).toEqual({
      "npm.stackra.figentra.com-worker": {
        accountId: "acc-1",
        hostname: "npm.stackra.figentra.com",
        service: "stackra-registry",
        zoneId: "zone-fig",
      },
    });
  });

  it("adopts an existing custom domain", async () => {
    await settled(registryWorker({ ...ARGS, importDomain: "dom-1" }));
    const [domain] = declaredAs(
      declared,
      "cloudflare:index/workersCustomDomain:WorkersCustomDomain",
    );
    expect(domain?.importId).toBe("acc-1/dom-1");
  });
});
