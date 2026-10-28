/**
 * Stackra file contract:
 * Purpose: unit tests of `verifyJwtHs256` (the `jwt_hs256` scheme): a Tamara-shaped `tamaraToken` signed HS256 with the
 *          notification token verifies from the query or a `Bearer` header under any of several secrets; a wrong
 *          secret, a changed claim, `alg: none` or another algorithm, an expired or not-yet-valid token, a malformed
 *          token and a missing one answer false; an empty secret is a configuration error.
 * Boundary: test only; the carrier names follow Tamara's public notification documentation and every token is made here
 *           (no captured delivery, no vendor value quoted): certification pending (owner decision D3).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0308 (rule 15); RFC 7519; STA-1357.
 */
import type { WebhookSchemeRecipe } from "@stackra/integrations";
import { describe, expect, it } from "@stackra/testing";

import { verifyJwtHs256 } from "#core/functions/verify-jwt-hs256.function";

const SECRET = "test-tamara-notification-token";
const NOW = new Date("2026-10-27T09:00:00Z");
const SECONDS = NOW.getTime() / 1000;
const RECIPE: WebhookSchemeRecipe = { query: "tamaraToken", header: "authorization" };

/** Base64url of `bytes`. */
const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCodePoint(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
const segment = (value: object) => base64url(new TextEncoder().encode(JSON.stringify(value)));

/** A JWT of `claims` under `header`, signed HS256 with `secret`. */
async function jwt(claims: object, secret = SECRET, header: object = { alg: "HS256", typ: "JWT" }) {
  const content = `${segment(header)}.${segment(claims)}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(content)),
  );
  return `${content}.${base64url(mac)}`;
}

/** A request carrying `value` as `?tamaraToken=`. */
const query = (value: string) => ({ headers: {}, query: { tamaraToken: value } });

const CLAIMS = { iss: "Tamara", iat: SECONDS - 60, exp: SECONDS + 3600 };

describe(verifyJwtHs256, () => {
  it("verifies a token from the query or a Bearer header", async () => {
    const token = await jwt(CLAIMS);
    await expect(
      verifyJwtHs256({ headers: {}, query: { tamaraToken: token } }, RECIPE, [SECRET], NOW),
    ).resolves.toBe(true);
    await expect(
      verifyJwtHs256(
        { headers: { authorization: `Bearer ${token}` } },
        RECIPE,
        ["older", SECRET],
        NOW,
      ),
    ).resolves.toBe(true);
  });

  it("refuses a wrong secret, a changed claim and any algorithm but HS256", async () => {
    const token = await jwt(CLAIMS);
    await expect(verifyJwtHs256(query(token), RECIPE, ["other"], NOW)).resolves.toBe(false);
    const [head, , signature] = token.split(".");
    const forged = `${head}.${segment({ ...CLAIMS, iss: "Someone" })}.${signature}`;
    await expect(verifyJwtHs256(query(forged), RECIPE, [SECRET], NOW)).resolves.toBe(false);
    const none = `${segment({ alg: "none" })}.${segment(CLAIMS)}.`;
    await expect(verifyJwtHs256(query(none), RECIPE, [SECRET], NOW)).resolves.toBe(false);
    const hs512 = await jwt(CLAIMS, SECRET, { alg: "HS512" });
    await expect(verifyJwtHs256(query(hs512), RECIPE, [SECRET], NOW)).resolves.toBe(false);
  });

  it("refuses an expired, a not-yet-valid, a malformed and a missing token", async () => {
    const expired = await jwt({ ...CLAIMS, exp: SECONDS });
    await expect(verifyJwtHs256(query(expired), RECIPE, [SECRET], NOW)).resolves.toBe(false);
    const early = await jwt({ ...CLAIMS, nbf: SECONDS + 1 });
    await expect(verifyJwtHs256(query(early), RECIPE, [SECRET], NOW)).resolves.toBe(false);
    const textExp = await jwt({ ...CLAIMS, exp: "later" });
    await expect(verifyJwtHs256(query(textExp), RECIPE, [SECRET], NOW)).resolves.toBe(false);
    await expect(verifyJwtHs256(query("a.b"), RECIPE, [SECRET], NOW)).resolves.toBe(false);
    await expect(verifyJwtHs256(query("a!.b.c"), RECIPE, [SECRET], NOW)).resolves.toBe(false);
    await expect(verifyJwtHs256({ headers: {} }, RECIPE, [SECRET], NOW)).resolves.toBe(false);
  });

  it("refuses an empty secret as a configuration error", async () => {
    const token = await jwt(CLAIMS);
    await expect(
      verifyJwtHs256({ headers: {}, query: { tamaraToken: token } }, RECIPE, [""], NOW),
    ).rejects.toThrow(TypeError);
  });
});
