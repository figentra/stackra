/**
 * Stackra file contract:
 * Purpose: unit tests of the API key helpers: `crc32` matches the standard check value; a minted key has its kind's
 *          prefix, a base-62 body and a matching checksum; a typo breaks the checksum; an unknown prefix is no key;
 *          `isOriginAllowed` takes exact origins and one-label wildcards only; `checkPublishableKey` refuses a secret
 *          key, a broken key and an unbound origin.
 * Boundary: test only; the default prefixes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0278 (decisions 4 and 5); COM-56.
 */
import { buildConfig } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";
import { crc32 } from "@stackra/support";

import { IdentityConfig } from "#config/identity.config";
import { ApiKeyKind } from "#core/enums/api-key-kind.enum";
import { ApiKeyRejectedError } from "#core/errors/api-key-rejected.error";
import { checkPublishableKey } from "#core/functions/check-publishable-key.function";
import { isOriginAllowed } from "#core/functions/is-origin-allowed.function";
import { mintApiKey } from "#core/functions/mint-api-key.function";
import { parseApiKey } from "#core/functions/parse-api-key.function";

const identity = buildConfig(IdentityConfig);

describe("API keys", () => {
  it("computes the standard CRC-32", () => {
    expect(crc32("123456789")).toBe(0xcbf43926);
  });

  it("mints a well-formed key of each kind", () => {
    const publishable = mintApiKey(ApiKeyKind.Publishable, identity);
    expect(publishable).toMatch(/^stackra_pk_[0-9A-Za-z]{36}$/);
    expect(parseApiKey(publishable, identity)).toEqual({ kind: "publishable", wellFormed: true });
    const secret = mintApiKey(ApiKeyKind.Secret, identity);
    expect(parseApiKey(secret, identity)).toEqual({ kind: "secret", wellFormed: true });
    expect(mintApiKey(ApiKeyKind.Secret, identity)).not.toBe(secret);
  });

  it("catches a typo and ignores an unknown prefix", () => {
    const key = mintApiKey(ApiKeyKind.Publishable, identity);
    const typo = `${key.slice(0, 15)}${key[15] === "a" ? "b" : "a"}${key.slice(16)}`;
    expect(parseApiKey(typo, identity)?.wellFormed).toBe(false);
    expect(parseApiKey("ghp_abc", identity)).toBeUndefined();
  });

  it("allows exact origins and one-label wildcards only", () => {
    const allowed = ["https://shop.acme.example", "https://*.brand.example"];
    expect(isOriginAllowed("https://shop.acme.example", allowed)).toBe(true);
    expect(isOriginAllowed("https://eu.brand.example", allowed)).toBe(true);
    expect(isOriginAllowed("https://a.b.brand.example", allowed)).toBe(false);
    expect(isOriginAllowed("https://brand.example", allowed)).toBe(false);
    expect(isOriginAllowed("http://shop.acme.example", allowed)).toBe(false);
    expect(isOriginAllowed("https://shop.acme.example:8443", allowed)).toBe(false);
    expect(isOriginAllowed(null, allowed)).toBe(false);
  });

  it("checks a publishable key and its origin", () => {
    const key = mintApiKey(ApiKeyKind.Publishable, identity);
    const origins = ["https://shop.acme.example"];
    expect(() =>
      checkPublishableKey(key, "https://shop.acme.example", origins, identity),
    ).not.toThrow();
    expect(() => checkPublishableKey(key, "https://evil.example", origins, identity)).toThrow(
      ApiKeyRejectedError,
    );
    const secret = mintApiKey(ApiKeyKind.Secret, identity);
    expect(() =>
      checkPublishableKey(secret, "https://shop.acme.example", origins, identity),
    ).toThrow(ApiKeyRejectedError);
  });
});
