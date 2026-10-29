/**
 * Stackra file contract:
 * Purpose: unit tests of `jwksKeySource`: it follows the discovery document to the key set, serves a known `kid` from
 *          the cache, refetches once for an unknown `kid` (and not again inside the refetch window), refetches after
 *          the cache time, and throws on a failing answer or a discovery document that names another issuer.
 * Boundary: test only; a recording fetch stub and a mocked clock.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0206 (decision 8); OpenID Connect Discovery 1.0.
 */
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { jwksKeySource } from "#core/functions/jwks-key-source.function";

const ISSUER = "https://auth.example.test";

/** A fetch stub over a discovery document and a mutable key set; records each URL. */
function issuer(discoveryIssuer = ISSUER) {
  const calls: string[] = [];
  const state = {
    keys: [{ kid: "k1", kty: "RSA" }] as { kid: string; kty: string }[],
    status: 200,
  };
  const fetcher = (async (input: string | URL | Request) => {
    const url = String(input);
    calls.push(url);
    const body = url.endsWith("/.well-known/openid-configuration")
      ? { issuer: discoveryIssuer, jwks_uri: `${ISSUER}/oauth/v2/keys` }
      : { keys: state.keys };
    return new Response(JSON.stringify(body), { status: state.status });
  }) as typeof fetch;
  return { calls, state, fetcher };
}

describe("jwksKeySource", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date("2026-10-29T12:00:00Z") });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("follows discovery to the key set and caches it", async () => {
    const { calls, fetcher } = issuer();
    const keys = jwksKeySource(ISSUER, 3600, fetcher);
    expect(await keys("k1")).toEqual({ kid: "k1", kty: "RSA" });
    expect(await keys("k1")).toEqual({ kid: "k1", kty: "RSA" });
    expect(calls).toEqual([
      `${ISSUER}/.well-known/openid-configuration`,
      `${ISSUER}/oauth/v2/keys`,
    ]);
  });

  it("refetches once for an unknown kid, then not again inside the window", async () => {
    const { calls, state, fetcher } = issuer();
    const keys = jwksKeySource(ISSUER, 3600, fetcher);
    await keys("k1");
    vi.advanceTimersByTime(31_000);
    state.keys = [...state.keys, { kid: "k2", kty: "RSA" }];
    expect(await keys("k2")).toEqual({ kid: "k2", kty: "RSA" });
    expect(calls).toHaveLength(4);
    expect(await keys("unknown")).toBeNull();
    expect(calls).toHaveLength(4);
  });

  it("refetches after the cache time", async () => {
    const { calls, fetcher } = issuer();
    const keys = jwksKeySource(ISSUER, 60, fetcher);
    await keys("k1");
    vi.advanceTimersByTime(61_000);
    await keys("k1");
    expect(calls).toHaveLength(4);
  });

  it("throws on a failing answer", async () => {
    const { state, fetcher } = issuer();
    state.status = 503;
    await expect(jwksKeySource(ISSUER, 3600, fetcher)("k1")).rejects.toThrow(/503/);
  });

  it("throws when discovery names another issuer", async () => {
    const { fetcher } = issuer("https://evil.test");
    await expect(jwksKeySource(ISSUER, 3600, fetcher)("k1")).rejects.toThrow(/another issuer/);
  });
});
