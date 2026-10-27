/**
 * Stackra file contract:
 * Purpose: unit tests of `readSettings`: the wrangler.jsonc vars parse into the settings (numbers or strings), and a
 *          missing or malformed var throws instead of falling back to a code default.
 * Boundary: pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decision 19).
 */
import { SETTINGS } from "#src/__tests__/fixtures/registry.fixture";
import type { RegistryEnv } from "#src/interfaces/registry-env.interface";
import { readSettings } from "#src/settings/read-settings";

const VARS = {
  REGISTRY_HOST: "npm.stackra.figentra.com",
  REGISTRY_MAX_TARBALL_BYTES: 52428800,
  REGISTRY_MAX_UNPACKED_BYTES: 104857600,
  REGISTRY_PUBLISH_TOKEN_SECONDS: 900,
  REGISTRY_TOKEN_CACHE_SECONDS: "60",
  REGISTRY_LICENCE_GRACE_DAYS: 14,
  REGISTRY_LICENCE_MAX_TOKENS: 20,
  REGISTRY_OIDC_ISSUER: "https://token.actions.githubusercontent.com",
  REGISTRY_OIDC_KEYS_SECONDS: 3600,
  REGISTRY_OPEN_PACKUMENT_MAX_AGE: 60,
  REGISTRY_CATALOGUE_MAX_LIMIT: 100,
  REGISTRY_LICENCE_DOCS_URL: "https://docs.stackra.figentra.com/licensing",
  REGISTRY_SIGNING_KEY_EXPIRES: "",
  REGISTRY_RETIRED_KEYS: "[]",
};

const env = (vars: Record<string, unknown>) =>
  ({ ...vars, REGISTRY_SIGNING_KEY: "pem" }) as unknown as RegistryEnv;

describe("readSettings", () => {
  it("reads the wrangler.jsonc defaults", () => {
    expect(readSettings(env(VARS))).toEqual(SETTINGS);
  });

  it("reads the retired keys and the key expiry", () => {
    const settings = readSettings(
      env({
        ...VARS,
        REGISTRY_SIGNING_KEY_EXPIRES: "2027-10-27",
        REGISTRY_RETIRED_KEYS: '[{"key":"AAAA","expires":"2026-10-27"}]',
      }),
    );
    expect(settings.signingKeyExpires).toBe("2027-10-27");
    expect(settings.retiredKeys).toEqual([{ key: "AAAA", expires: "2026-10-27" }]);
  });

  it.each([
    ["REGISTRY_MAX_TARBALL_BYTES", undefined],
    ["REGISTRY_PUBLISH_TOKEN_SECONDS", "15m"],
    ["REGISTRY_LICENCE_GRACE_DAYS", -1],
    ["REGISTRY_CATALOGUE_MAX_LIMIT", 0],
    ["REGISTRY_RETIRED_KEYS", '{"key":"x"}'],
  ])("refuses %s = %s", (name, value) => {
    expect(() => readSettings(env({ ...VARS, [name]: value }))).toThrow();
  });
});
