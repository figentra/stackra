/**
 * Stackra file contract:
 * Purpose: unit tests of `dockerHubCache` under Pulumi's mocks: the pull-through cache rule serves Docker Hub under the
 *          `docker-hub` prefix and authenticates with a secret named under ECR's required `ecr-pullthroughcache/`
 *          prefix, created without a value.
 * Boundary: test only; no engine and no cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0493, ADR 0173.
 */
import { describe, expect, it } from "@stackra/testing";

import { dockerHubCache } from "#node/functions/docker-hub-cache.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";

describe("dockerHubCache", () => {
  it("serves Docker Hub under docker-hub/ with a secret ECR accepts, holding no value", async () => {
    const engine = await mockPulumi();
    dockerHubCache("acme", {});

    const secret = await engine.find("Secret", "acme-docker-hub-cache");
    expect(secret.inputs["name"]).toBe("ecr-pullthroughcache/docker-hub");
    const versions = (await engine.settled()).filter((resource) =>
      resource.type.endsWith(":SecretVersion"),
    );
    expect(versions).toEqual([]);
    expect(
      (await engine.find("PullThroughCacheRule", "acme-docker-hub-cache")).inputs,
    ).toMatchObject({
      ecrRepositoryPrefix: "docker-hub",
      upstreamRegistryUrl: "registry-1.docker.io",
    });
  });
});
