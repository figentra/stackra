/**
 * Stackra file contract:
 * Purpose: unit tests of `devIssuerKeys`: off (undefined) with no dev keys in any environment; the parsed public keys
 *          in `dev`; dev keys refused (`ConfigInvalidError` naming `STACKRA_DEV_ISSUER_KEYS`, never the value) in every
 *          deployed environment and with no `STACKRA_ENVIRONMENT` at all; a set that is not JSON, empty, too large, or
 *          holding a private key, an RSA key or a key with no `kid` refused even in `dev`; one answer per configuration.
 * Boundary: test only; plain configuration objects and real ES256 public keys.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0206 (decision 8, amendment of 2026-11-26: the dev issuer); ADR 0170 (decision 5).
 */
import { ConfigInvalidError } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { createDevIssuerKey } from "#core/functions/create-dev-issuer-key.function";
import { devIssuerKeys } from "#server/functions/dev-issuer-keys.function";

const key = await createDevIssuerKey();
const SET = JSON.stringify({ keys: [key.publicKey] });

/** A configuration with `devKeys` in `environment`. */
const config = (devKeys: string, environment: string) => ({ devKeys, environment });

/** The refusal `devIssuerKeys` throws for `devKeys` in `environment`. */
function refusal(devKeys: string, environment: string): ConfigInvalidError {
  try {
    devIssuerKeys(config(devKeys, environment));
  } catch (error) {
    if (error instanceof ConfigInvalidError) return error;
    throw error;
  }
  throw new Error("expected a refusal");
}

describe(devIssuerKeys, () => {
  it("is off with no dev keys, in every environment", () => {
    for (const environment of ["", "dev", "preview", "staging", "production"])
      expect(devIssuerKeys(config("", environment))).toBeUndefined();
  });

  it("answers the public keys under stackra dev", () => {
    expect(devIssuerKeys(config(SET, "dev"))).toEqual([key.publicKey]);
  });

  it("refuses dev keys in every deployed environment and with no environment, naming the variable only", () => {
    for (const environment of ["", "preview", "test", "staging", "production", "DEV"]) {
      const error = refusal(SET, environment);
      expect(error.issues).toEqual([
        { path: "STACKRA_DEV_ISSUER_KEYS", message: expect.stringContaining("stackra dev") },
      ]);
      expect(error.message).not.toContain(key.publicKey.x);
    }
    expect(refusal(SET, "").message).toContain("no STACKRA_ENVIRONMENT");
    expect(refusal(SET, "production").message).toContain("STACKRA_ENVIRONMENT=production");
  });

  it("refuses a key set that is not one of public ES256 keys, even in dev", () => {
    const { kid: _kid, ...noKid } = key.publicKey;
    for (const text of [
      "not json",
      "null",
      JSON.stringify({ keys: [] }),
      JSON.stringify({ keys: Array.from({ length: 9 }, () => key.publicKey) }),
      JSON.stringify({ keys: [key.privateKey] }),
      JSON.stringify({ keys: [{ ...key.publicKey, kty: "RSA" }] }),
      JSON.stringify({ keys: [{ ...key.publicKey, alg: "RS256" }] }),
      JSON.stringify({ keys: [noKid] }),
      JSON.stringify([key.publicKey]),
    ])
      expect(refusal(text, "dev").issues[0]?.path).toBe("STACKRA_DEV_ISSUER_KEYS");
    expect(refusal(JSON.stringify({ keys: [key.privateKey] }), "dev").message).not.toContain(
      String(key.privateKey.d),
    );
  });

  it("answers once per configuration instance", () => {
    const once = config(SET, "dev");
    expect(devIssuerKeys(once)).toBe(devIssuerKeys(once));
  });
});
