/**
 * Stackra file contract:
 * Purpose: unit tests of `OidcJsonWebKeysDriver`: it reads the configured issuer's discovery document and key set over
 *          the global `fetch`, answers the key of a known `kid`, answers null for an unknown one, serves a repeat
 *          lookup from its cache, takes the issuer and the cache time from `BearerConfig`, and throws (never answers
 *          null) when the issuer cannot be reached.
 * Boundary: test only; a stubbed global `fetch` over a discovery document and a key set, no network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0206 (decision 8); OpenID Connect Discovery 1.0.
 */
import { buildConfig } from "@stackra/config";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { BearerConfig } from "#config/bearer.config";
import { OidcJsonWebKeysDriver } from "#server/drivers/oidc-json-web-keys.driver";

const ISSUER = "https://auth.example.test";

/** A `BearerConfig` naming `ISSUER` and a `keysSeconds` cache time. */
const configOf = (keysSeconds = 3600): BearerConfig =>
  buildConfig(BearerConfig, { values: { issuer: ISSUER, keysSeconds } });

/** The URLs the stubbed `fetch` was asked for, in order. */
let asked: string[];

/** What the issuer answers: its key set, and the status of every answer. */
let issuer: { keys: { kid: string; kty: string }[]; status: number };

beforeEach(() => {
  asked = [];
  issuer = { keys: [{ kid: "k1", kty: "RSA" }], status: 200 };
  vi.stubGlobal("fetch", async (input: string | URL | Request) => {
    const url = String(input);
    asked.push(url);
    const body = url.endsWith("/.well-known/openid-configuration")
      ? { issuer: ISSUER, jwks_uri: `${ISSUER}/oauth/v2/keys` }
      : { keys: issuer.keys };
    return new Response(JSON.stringify(body), { status: issuer.status });
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OidcJsonWebKeysDriver", () => {
  it("follows the issuer's discovery document to its key set and answers the key of a kid", async () => {
    const keys = new OidcJsonWebKeysDriver(configOf());
    expect(await keys.find("k1")).toEqual({ kid: "k1", kty: "RSA" });
    expect(asked).toEqual([
      `${ISSUER}/.well-known/openid-configuration`,
      `${ISSUER}/oauth/v2/keys`,
    ]);
  });

  it("serves a second lookup of a held kid from its cache, without another request", async () => {
    const keys = new OidcJsonWebKeysDriver(configOf());
    await keys.find("k1");
    expect(await keys.find("k1")).toEqual({ kid: "k1", kty: "RSA" });
    expect(asked).toHaveLength(2);
  });

  it("answers null for a kid the key set does not hold", async () => {
    const keys = new OidcJsonWebKeysDriver(configOf());
    expect(await keys.find("unknown")).toBeNull();
  });

  it("keeps one cache per driver: a second driver reads the issuer again", async () => {
    await new OidcJsonWebKeysDriver(configOf()).find("k1");
    await new OidcJsonWebKeysDriver(configOf()).find("k1");
    expect(asked).toHaveLength(4);
  });

  it("throws, and does not answer null, when the issuer cannot be reached", async () => {
    issuer.status = 503;
    const keys = new OidcJsonWebKeysDriver(configOf());
    await expect(keys.find("k1")).rejects.toThrow("answered 503");
  });
});
