/**
 * Stackra file contract:
 * Purpose: unit tests of `LoginDirectoryOptions`, `LoginDirectoryConfig` and `LOGIN_DIRECTORY_CONFIG_SCHEMA`: the shape
 *          is registered with the shipped schema, its initializers equal the shipped defaults (all unset), a region or
 *          key id with `:` is refused, and the key is filled from the `IDENTITY_LOGIN_DIRECTORY_KEY` secret.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26); ADR 0173; ADR 0451.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { describe, expect, it } from "@stackra/testing";
import { Schema, schemaOf } from "@stackra/validation";

import { LoginDirectoryConfig } from "#config/login-directory.config";
import { LOGIN_DIRECTORY_CONFIG_SCHEMA } from "#core/constants/login-directory-config-schema.constant";
import { LoginDirectoryOptions } from "#core/schemas/login-directory-options.schema";

describe("LoginDirectoryOptions", () => {
  it("is a shape registered with the shipped schema, with equal defaults", () => {
    expect(new LoginDirectoryOptions()).toBeInstanceOf(Schema);
    expect(schemaOf(LoginDirectoryOptions)).toBe(LOGIN_DIRECTORY_CONFIG_SCHEMA);
    expect({ ...new LoginDirectoryOptions() }).toEqual(LOGIN_DIRECTORY_CONFIG_SCHEMA.parse({}));
  });

  it("takes key parts without ':'", () => {
    expect(
      LOGIN_DIRECTORY_CONFIG_SCHEMA.parse({ region: "me-central", keyId: "k2026-10" }),
    ).toEqual({
      region: "me-central",
      keyId: "k2026-10",
      secret: "",
    });
    expect(LOGIN_DIRECTORY_CONFIG_SCHEMA.safeParse({ region: "eu:1" }).success).toBe(false);
    expect(LOGIN_DIRECTORY_CONFIG_SCHEMA.safeParse({ keyId: "K1" }).success).toBe(false);
  });

  it("fills the key from its secret", () => {
    const secrets = new (class extends SecretStore {
      get(name: string): string | undefined {
        return name === "IDENTITY_LOGIN_DIRECTORY_KEY" ? "hmac-key" : undefined;
      }
    })();
    expect(buildConfig(LoginDirectoryConfig, { secrets }).secret).toBe("hmac-key");
  });
});
