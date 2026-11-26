/**
 * Stackra file contract:
 * Purpose: unit tests of `readSettings`: the wrangler.jsonc vars parse into the settings (numbers or strings), the
 *          OIDC audiences default to `npm:<host>` and the read-only switch to off, and a missing or malformed var
 *          throws instead of falling back to a code default.
 * Boundary: pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decision 19).
 */
import { ENV_VARS as VARS, SETTINGS } from "#src/__tests__/fixtures/registry.fixture";
import type { RegistryEnv } from "#src/interfaces/registry-env.interface";
import { readSettings } from "#src/settings/read-settings";

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

  it("reads the OIDC audiences and the read-only switch (STA-1733)", () => {
    const settings = readSettings(
      env({
        ...VARS,
        REGISTRY_OIDC_AUDIENCES: '["npm:registry.figentra.com","npm:npm.stackra.figentra.com"]',
        REGISTRY_READ_ONLY: "true",
      }),
    );
    expect(settings.oidcAudiences).toEqual([
      "npm:registry.figentra.com",
      "npm:npm.stackra.figentra.com",
    ]);
    expect(settings.readOnly).toBe(true);
    expect(
      readSettings(env({ ...VARS, REGISTRY_OIDC_AUDIENCES: "", REGISTRY_READ_ONLY: "" })),
    ).toEqual(SETTINGS);
  });

  it.each([
    ["REGISTRY_OIDC_AUDIENCES", "[]"],
    ["REGISTRY_OIDC_AUDIENCES", '"npm:x"'],
    ["REGISTRY_OIDC_AUDIENCES", "[1]"],
    ["REGISTRY_MAX_TARBALL_BYTES", undefined],
    ["REGISTRY_PUBLISH_TOKEN_SECONDS", "15m"],
    ["REGISTRY_LICENCE_GRACE_DAYS", -1],
    ["REGISTRY_CATALOGUE_MAX_LIMIT", 0],
    ["REGISTRY_RETIRED_KEYS", '{"key":"x"}'],
  ])("refuses %s = %s", (name, value) => {
    expect(() => readSettings(env({ ...VARS, [name]: value }))).toThrow();
  });
});
