/**
 * Stackra file contract:
 * Purpose: unit tests of `accessGate`: the GitHub organisation policy, a service token and a non-identity policy per
 *          machine, the bypass policy, and the applications over `*.<dev zone>`, the operator URIs and the bypassed
 *          paths with their policy order; with no tokens, operator URIs or bypass, one application and one policy.
 * Boundary: test only; Pulumi under mocks, so no provider or cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0290 (decisions 2, 6 and 11).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { parseCloudflareStack } from "#core/functions/parse-cloudflare-stack.function";
import { accessGate } from "#node/functions/access-gate.function";
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

/** The Access config of a stack with `access`. */
const accessOf = (access: Record<string, unknown>) => {
  const parsed = parseCloudflareStack({ devZone: "figentra.cloud", access }).access;
  if (parsed === undefined) throw new Error("Expected an Access config");
  return parsed;
};

/** The declared inputs of each resource of `type`, keyed by resource name. */
const inputsOf = (type: string) => inputsByName(declared, type);

/** The inputs of the self-hosted application `name` over `uri` with `policies`. */
const application = (name: string, uri: string, policies: unknown) => ({
  accountId: "acc-1",
  name: `figentra ${name}`,
  type: "self_hosted",
  domain: uri,
  destinations: [{ type: "public", uri }],
  allowedIdps: ["idp-1"],
  autoRedirectToIdentity: true,
  sessionDuration: "24h",
  policies,
});

describe("accessGate", () => {
  it("guards the dev zone and the operator surfaces, and bypasses the listed paths", async () => {
    await settled(
      accessGate({
        accountId: "acc-1",
        project: "figentra",
        devZone: "figentra.cloud",
        identityProviderId: "idp-1",
        access: accessOf({
          githubOrganization: "figentra",
          identityProviderId: "idp-1",
          operatorUris: ["api.figentra.com/platform"],
          bypass: ["*.figentra.cloud/api/auth/callback"],
          serviceTokens: ["box"],
        }),
      }),
    );

    expect(
      inputsOf("cloudflare:index/zeroTrustAccessServiceToken:ZeroTrustAccessServiceToken"),
    ).toEqual({
      "access-token-box": { accountId: "acc-1", name: "figentra-box" },
    });
    expect(inputsOf("cloudflare:index/zeroTrustAccessPolicy:ZeroTrustAccessPolicy")).toEqual({
      "access-github": {
        accountId: "acc-1",
        name: "figentra github",
        decision: "allow",
        includes: [{ githubOrganization: { identityProviderId: "idp-1", name: "figentra" } }],
        sessionDuration: "24h",
      },
      "access-machines": {
        accountId: "acc-1",
        name: "figentra machines",
        decision: "non_identity",
        includes: [{ serviceToken: { tokenId: "access-token-box-id" } }],
        sessionDuration: "24h",
      },
      "access-bypass": {
        accountId: "acc-1",
        name: "figentra bypass",
        decision: "bypass",
        includes: [{ everyone: {} }],
        sessionDuration: "24h",
      },
    });
    const guarded = [
      { id: "access-github-id", precedence: 1 },
      { id: "access-machines-id", precedence: 2 },
    ];
    expect(
      inputsOf("cloudflare:index/zeroTrustAccessApplication:ZeroTrustAccessApplication"),
    ).toEqual({
      "access-dev": application("dev", "*.figentra.cloud", guarded),
      "access-operator": application("operator", "api.figentra.com/platform", guarded),
      "access-bypass": application("bypass", "*.figentra.cloud/api/auth/callback", [
        { id: "access-bypass-id", precedence: 1 },
      ]),
    });
  });

  it("declares one policy and one application when nothing else is asked", async () => {
    const gate = accessGate({
      accountId: "acc-1",
      project: "figentra",
      devZone: "figentra.cloud",
      identityProviderId: "idp-1",
      access: accessOf({
        githubOrganization: "figentra",
        identityProviderId: "idp-1",
        sessionDuration: "8h",
      }),
    });
    await settled(gate);

    expect(gate.policies).toHaveLength(1);
    expect(gate.applications).toHaveLength(1);
    expect(gate.serviceTokens).toEqual([]);
    expect(
      inputsOf("cloudflare:index/zeroTrustAccessApplication:ZeroTrustAccessApplication")[
        "access-dev"
      ],
    ).toMatchObject({
      sessionDuration: "8h",
      policies: [{ id: "access-github-id", precedence: 1 }],
    });
  });
});
