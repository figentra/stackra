/**
 * Stackra file contract:
 * Purpose: unit tests of `BearerTokenGuard`: it runs after the edge, origin and CSRF guards (order -50); it lets a
 *          valid bearer token through and puts its claims on the request's `VerifiedToken`; it lets a request with no
 *          token through only on a public path; it refuses a missing token off a public path, a non-bearer scheme, an
 *          invalid token (wrong audience), a token whose key is unknown, and every token while the issuer is unset.
 * Boundary: test only; a real Web Crypto RS256 key pair, the memory key driver and `buildConfig`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0206 (decision 8); ADR 0437 (decision 8); ADR 0457.
 */
import { buildConfig } from "@stackra/config";
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { BearerConfig } from "#config/bearer.config";
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
async function setup(env: Record<string, string> = {}) {
  const config = buildConfig(BearerConfig, {
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
});
