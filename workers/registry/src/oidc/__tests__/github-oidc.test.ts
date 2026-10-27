/**
 * Stackra file contract:
 * Purpose: unit tests of GitHub OIDC: `verifyGithubToken` (signature, alg, unknown kid) through `jwksSource` with a
 *          KV hit and a refetch on an unknown kid, and `matchPublisher` (names and numeric ids).
 * Boundary: no network; a recorded fake fetch serves the key set.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decision 6).
 */
import { MemoryKv } from "#src/__tests__/fixtures/memory-bindings.fixture";
import {
  createTestRegistry,
  HOST,
  ISSUER,
  NOW,
  STACKRA_CLAIMS,
} from "#src/__tests__/fixtures/registry.fixture";
import type { PublisherRow } from "#src/interfaces/publisher-row.interface";
import { jwksSource } from "#src/oidc/jwks-source";
import { matchPublisher } from "#src/oidc/match-publisher";
import { OidcError } from "#src/oidc/oidc-error";
import { verifyGithubToken } from "#src/oidc/verify-github-token";

const PUBLISHER: PublisherRow = {
  scope: "@stackra",
  repository: "figentra/stackra",
  repository_id: "1425140001",
  repository_owner_id: "314302700",
  workflow: ".github/workflows/release.yml",
  ref: "refs/heads/main",
  environment: "release",
};

describe("verifyGithubToken", () => {
  it("verifies a token and caches the key set in KV", async () => {
    const registry = await createTestRegistry();
    const options = {
      issuer: ISSUER,
      audience: `npm:${HOST}`,
      now: NOW,
      keys: registry.deps.oidcKeys,
    };
    expect(await verifyGithubToken(await registry.idToken(), options)).toEqual(STACKRA_CLAIMS);
    await verifyGithubToken(await registry.idToken(), options);
    expect(registry.fetches).toHaveLength(1);
    expect(registry.cache.calls.filter((call) => call.method === "put")).toEqual([
      { method: "put", args: ["oidc:github:jwks", expect.any(String), { expirationTtl: 3600 }] },
    ]);
  });

  it("refuses a tampered token and an unknown key", async () => {
    const registry = await createTestRegistry();
    const options = {
      issuer: ISSUER,
      audience: `npm:${HOST}`,
      now: NOW,
      keys: registry.deps.oidcKeys,
    };
    const [header, , signature] = (await registry.idToken()).split(".");
    const forged = `${header}.${btoa(JSON.stringify({ ...STACKRA_CLAIMS, repository: "x/y" }))}.${signature}`;
    await expect(verifyGithubToken(forged, options)).rejects.toThrow("signature is invalid");
    await expect(
      verifyGithubToken(await registry.idToken(STACKRA_CLAIMS, "gh-2"), options),
    ).rejects.toThrow("key is unknown");
    await expect(verifyGithubToken("not-a-jwt", options)).rejects.toThrow(OidcError);
  });
});

describe("jwksSource", () => {
  it("refetches once when the cached set lacks the kid", async () => {
    const cache = new MemoryKv();
    cache.values.set("oidc:github:jwks", JSON.stringify({ keys: [{ kid: "old" }] }));
    const fetched: string[] = [];
    const source = jwksSource(
      cache,
      (async (input: string | URL | Request) => {
        fetched.push(String(input));
        return new Response(JSON.stringify({ keys: [{ kid: "new", kty: "RSA" }] }));
      }) as typeof fetch,
      ISSUER,
      3600,
    );
    expect(await source("old")).toEqual({ kid: "old" });
    expect(await source("new")).toEqual({ kid: "new", kty: "RSA" });
    expect(fetched).toEqual([`${ISSUER}/.well-known/jwks`]);
  });
});

describe("matchPublisher", () => {
  it("matches on every name and id", () => {
    expect(matchPublisher(STACKRA_CLAIMS, [PUBLISHER])).toBe(PUBLISHER);
    expect(matchPublisher({ ...STACKRA_CLAIMS, repository_id: "1" }, [PUBLISHER])).toBeNull();
    expect(matchPublisher({ ...STACKRA_CLAIMS, ref: "refs/heads/dev" }, [PUBLISHER])).toBeNull();
  });
});
