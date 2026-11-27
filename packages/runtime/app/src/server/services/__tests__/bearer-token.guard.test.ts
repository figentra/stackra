/**
 * Stackra file contract:
 * Purpose: unit tests of `BearerTokenGuard`: it runs after the edge, origin and CSRF guards (order -50); it lets a
 *          valid bearer token through and puts its claims on the request's `VerifiedToken`; it lets a request with no
 *          token through only on a public path; it refuses a missing token off a public path, a non-bearer scheme, an
 *          invalid token (wrong audience), a token whose key is unknown, and every token while the issuer is unset; it
 *          lets a dev token through only where the one environment reader answers `dev` (STA-2795, STA-2844): on a
 *          production platform it throws `ConfigInvalidError` instead, even when the bearer configuration carries a
 *          free-string `environment = "dev"` (the old `app.bearer.environment`).
 * Boundary: test only; a real Web Crypto RS256 key pair, the memory key driver and `buildConfig`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0206 (decision 8); ADR 0437 (decision 8); ADR 0457; ADR 0296 (amendment
 *                     2026-11-26); STA-2844.
 */
import { buildConfig, ConfigInvalidError } from "@stackra/config";
import { isRefusal } from "@stackra/errors";
import { Realm } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { BearerConfig } from "#config/bearer.config";
import { createDevIssuerKey } from "#core/functions/create-dev-issuer-key.function";
import { mintDevToken } from "#core/functions/mint-dev-token.function";
import { PLATFORM_ENVIRONMENT_HOST } from "#server/constants/platform-environment-host.constant";
import { MemoryJsonWebKeysDriver } from "#server/drivers/memory-json-web-keys.driver";
import { BearerTokenInvalidError } from "#server/errors/bearer-token-invalid.error";
import { BearerTokenGuard } from "#server/services/bearer-token.guard";
import { VerifiedToken } from "#server/services/verified-token.service";

const ISSUER = "https://auth.example.test";
const AUDIENCE = "project-1";

const b64 = (value: Uint8Array | object): string =>
  btoa(
    String.fromCodePoint(
      ...(value instanceof Uint8Array ? value : new TextEncoder().encode(JSON.stringify(value))),
    ),
  )
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");

const pair = await crypto.subtle.generateKey(
  {
    name: "RSASSA-PKCS1-v1_5",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
  },
  true,
  ["sign", "verify"],
);

/** An RS256 token under key `k1` (or `kid`). */
async function token(claims: Record<string, unknown>, kid = "k1"): Promise<string> {
  const signing = `${b64({ alg: "RS256", kid })}.${b64(claims)}`;
  const mac = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    pair.privateKey,
    new TextEncoder().encode(signing),
  );
  return `${signing}.${b64(new Uint8Array(mac))}`;
}

const now = Math.floor(Date.now() / 1000);
const claims = { iss: ISSUER, aud: AUDIENCE, sub: "u1", exp: now + 300 };

/** A guard over one key, with `/public/` open, and the `VerifiedToken` it writes. */
async function setup(env: Record<string, string> = {}, type: typeof BearerConfig = BearerConfig) {
  const config = buildConfig(type, {
    env: { STACKRA_BEARER_ISSUER: ISSUER, STACKRA_BEARER_AUDIENCE: AUDIENCE, ...env },
  });
  const keys = new MemoryJsonWebKeysDriver();
  keys.keys = [{ ...(await crypto.subtle.exportKey("jwk", pair.publicKey)), kid: "k1" }];
  const verified = new VerifiedToken();
  class Guard extends BearerTokenGuard {
    override get publicPaths() {
      return ["/public/"];
    }
  }
  return { guard: new Guard(config, keys, verified), verified };
}

const request = (path: string, authorization?: string) =>
  new Request(`https://api.example.test${path}`, {
    headers: authorization === undefined ? {} : { authorization },
  });

const refuses = async (promise: Promise<void>) => {
  const refusal = await promise.then(
    () => undefined,
    (error: unknown) => error,
  );
  expect(isRefusal(refusal, BearerTokenInvalidError)).toBe(true);
};

describe("BearerTokenGuard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    PLATFORM_ENVIRONMENT_HOST.current = undefined;
  });

  it("runs after the edge, origin and CSRF guards", async () => {
    expect((await setup()).guard.order).toBe(-50);
  });

  it("lets a valid token through and records its claims", async () => {
    const { guard, verified } = await setup();
    await guard.check(request("/orders", `Bearer ${await token(claims)}`));
    expect(verified.claims).toEqual(claims);
  });

  it("lets a request with no token through on a public path only", async () => {
    const { guard, verified } = await setup();
    await guard.check(request("/public/terms"));
    expect(verified.claims).toBeUndefined();
    await refuses(guard.check(request("/orders")));
  });

  it("refuses a non-bearer scheme", async () => {
    const { guard } = await setup();
    await refuses(guard.check(request("/orders", "Basic dTpw")));
  });

  it("refuses a token for another audience", async () => {
    const { guard, verified } = await setup();
    await refuses(
      guard.check(request("/orders", `Bearer ${await token({ ...claims, aud: "x" })}`)),
    );
    expect(verified.claims).toBeUndefined();
  });

  it("refuses a token whose key is unknown", async () => {
    const { guard } = await setup();
    await refuses(guard.check(request("/orders", `Bearer ${await token(claims, "k9")}`)));
  });

  it("refuses every token while the issuer is unset", async () => {
    const { guard } = await setup({ STACKRA_BEARER_ISSUER: "" });
    await refuses(guard.check(request("/orders", `Bearer ${await token(claims)}`)));
  });

  it("lets a dev token through under stackra dev only", async () => {
    const key = await createDevIssuerKey();
    const dev = `Bearer ${await mintDevToken(key.privateKey, { userId: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3", realm: Realm.Staff })}`;
    vi.stubEnv("STACKRA_ENVIRONMENT", "dev");
    const on = await setup({ STACKRA_DEV_ISSUER_KEYS: JSON.stringify({ keys: [key.publicKey] }) });
    await on.guard.check(request("/orders", dev));
    expect(on.verified.claims).toMatchObject({ sub: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3" });
    const off = await setup();
    await refuses(off.guard.check(request("/orders", dev)));
  });

  it("judges dev sign-in by the one environment reader, never by a configuration value", async () => {
    const key = await createDevIssuerKey();
    const minted = await mintDevToken(key.privateKey, {
      userId: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
      realm: Realm.Staff,
    });
    const dev = `Bearer ${minted}`;
    // a host override carrying the old free-string app.bearer.environment
    class DevBearerConfig extends BearerConfig {
      environment = "dev";
    }
    const devKeys = { STACKRA_DEV_ISSUER_KEYS: JSON.stringify({ keys: [key.publicKey] }) };
    vi.stubEnv("STACKRA_ENVIRONMENT", undefined);
    PLATFORM_ENVIRONMENT_HOST.current = { name: "acme-prod", type: "production", cloud: "aws" };
    const { guard, verified } = await setup(devKeys, DevBearerConfig);
    await expect(guard.check(request("/orders", dev))).rejects.toThrow(ConfigInvalidError);
    expect(verified.claims).toBeUndefined();
    // and the configuration's own STACKRA_ENVIRONMENT=dev changes nothing either
    const named = await setup({ ...devKeys, STACKRA_ENVIRONMENT: "dev" });
    await expect(named.guard.check(request("/orders", dev))).rejects.toThrow(ConfigInvalidError);
  });
});
