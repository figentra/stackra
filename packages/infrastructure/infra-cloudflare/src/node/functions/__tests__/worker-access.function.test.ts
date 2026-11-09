/**
 * Stackra file contract:
 * Purpose: unit tests of `workerAccess`: one policy, and per internal-tool member an application over its custom
 *          domains and one over its Version URLs; no Version URL application without the `workers.dev` subdomain.
 * Boundary: test only; Pulumi under mocks, so no provider or cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0519 (decision 4).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { parseCloudflareStack } from "#core/functions/parse-cloudflare-stack.function";
import { workerAccess } from "#node/functions/worker-access.function";
import {
  inputsByName,
  mockPulumi,
  settled,
  type DeclaredResource,
} from "#node/functions/__tests__/fixtures/pulumi-mocks.fixture";

let declared: DeclaredResource[];

beforeEach(async () => {
  declared = await mockPulumi();
});

const access = (() => {
  const parsed = parseCloudflareStack({
    devZone: "figentra.cloud",
    access: { githubOrganization: "figentra", identityProviderId: "idp-1" },
  }).access;
  if (parsed === undefined) throw new Error("Expected an Access config");
  return parsed;
})();

const applications = () =>
  inputsByName(declared, "cloudflare:index/zeroTrustAccessApplication:ZeroTrustAccessApplication");

describe("workerAccess", () => {
  it("guards each member's domains and Version URLs behind the GitHub organisation", async () => {
    await settled(
      workerAccess({
        accountId: "acc-1",
        project: "figentra",
        identityProviderId: "idp-1",
        access,
        workersDevSubdomain: "figentra",
        members: { console: { hostnames: ["console.figentra.cloud"] } },
      }),
    );

    expect(
      inputsByName(declared, "cloudflare:index/zeroTrustAccessPolicy:ZeroTrustAccessPolicy"),
    ).toMatchObject({
      "access-worker-github": {
        decision: "allow",
        includes: [{ githubOrganization: { identityProviderId: "idp-1", name: "figentra" } }],
      },
    });
    const apps = applications();
    expect(Object.keys(apps)).toEqual(["access-worker-console", "access-worker-console-versions"]);
    expect(apps["access-worker-console"]).toMatchObject({
      destinations: [{ type: "public", uri: "console.figentra.cloud" }],
      policies: [{ id: "access-worker-github-id", precedence: 1 }],
    });
    expect(apps["access-worker-console-versions"]).toMatchObject({
      destinations: [{ type: "public", uri: "*-console.figentra.workers.dev" }],
    });
  });

  it("declares no Version URL application without the workers.dev subdomain", async () => {
    await settled(
      workerAccess({
        accountId: "acc-1",
        project: "figentra",
        identityProviderId: "idp-1",
        access,
        members: { console: { hostnames: ["console.figentra.cloud"] } },
      }),
    );

    expect(Object.keys(applications())).toEqual(["access-worker-console"]);
  });
});
