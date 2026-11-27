/**
 * Stackra file contract:
 * Purpose: unit tests of `devIssuerKeys`: off (undefined) with no dev keys in every environment; the parsed public keys
 *          when the running environment is `dev`; dev keys refused (`ConfigInvalidError` naming
 *          `STACKRA_DEV_ISSUER_KEYS`, never the value) in `test`, `preview`, `staging` and `production`; only the
 *          environment argument counts, so a configuration object that also carries a free-string `environment: "dev"`
 *          (the old `app.bearer.environment`) turns nothing on; a set that is not JSON, empty, too large, or holding a
 *          private key, an RSA key or a key with no `kid` refused even in `dev`; the parsed set cached per
 *          configuration while the environment is checked on every call.
 * Boundary: test only; plain configuration objects and real ES256 public keys.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0206 (decision 8, amendment of 2026-11-26: the dev issuer); ADR 0296 (amendment
 *                     2026-11-26); ADR 0170 (decision 5); STA-2844.
 */
import { ConfigInvalidError, StackraEnvironment } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { createDevIssuerKey } from "#core/functions/create-dev-issuer-key.function";
import { devIssuerKeys } from "#server/functions/dev-issuer-keys.function";

const key = await createDevIssuerKey();
const SET = JSON.stringify({ keys: [key.publicKey] });

/** Every environment outside `dev`. */
const NOT_DEV = [
  StackraEnvironment.Test,
  StackraEnvironment.Preview,
  StackraEnvironment.Staging,
  StackraEnvironment.Production,
];

/** The refusal `devIssuerKeys` throws for `devKeys` in `environment`. */
function refusal(devKeys: string, environment: StackraEnvironment): ConfigInvalidError {
  try {
    devIssuerKeys({ devKeys }, environment);
  } catch (error) {
    if (error instanceof ConfigInvalidError) return error;
    throw error;
  }
  throw new Error("expected a refusal");
}

describe(devIssuerKeys, () => {
  it("is off with no dev keys, in every environment", () => {
    for (const environment of [StackraEnvironment.Dev, ...NOT_DEV])
      expect(devIssuerKeys({ devKeys: "" }, environment)).toBeUndefined();
  });

  it("answers the public keys when the running environment is dev", () => {
    expect(devIssuerKeys({ devKeys: SET }, StackraEnvironment.Dev)).toEqual([key.publicKey]);
  });

  it("refuses dev keys in every other environment, naming the variable only", () => {
    for (const environment of NOT_DEV) {
      const error = refusal(SET, environment);
      expect(error.issues).toEqual([
        { path: "STACKRA_DEV_ISSUER_KEYS", message: expect.stringContaining("stackra dev") },
      ]);
      expect(error.message).toContain(`STACKRA_ENVIRONMENT=${environment}`);
      expect(error.message).not.toContain(key.publicKey.x);
    }
  });

  it("reads the environment from its argument only, never from a configuration value", () => {
    // the shape of the old BearerConfig: a free-string environment beside the keys
    const config = { devKeys: SET, environment: "dev" };
    expect(() => devIssuerKeys(config, StackraEnvironment.Production)).toThrow(ConfigInvalidError);
    expect(() => devIssuerKeys(config, StackraEnvironment.Staging)).toThrow(ConfigInvalidError);
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
      expect(refusal(text, StackraEnvironment.Dev).issues[0]?.path).toBe("STACKRA_DEV_ISSUER_KEYS");
    expect(
      refusal(JSON.stringify({ keys: [key.privateKey] }), StackraEnvironment.Dev).message,
    ).not.toContain(String(key.privateKey.d));
  });

  it("parses once per configuration instance and checks the environment on every call", () => {
    const once = { devKeys: SET };
    expect(devIssuerKeys(once, StackraEnvironment.Dev)).toBe(
      devIssuerKeys(once, StackraEnvironment.Dev),
    );
    // a cached answer never outlives the environment that allowed it
    expect(() => devIssuerKeys(once, StackraEnvironment.Production)).toThrow(ConfigInvalidError);
  });
});
