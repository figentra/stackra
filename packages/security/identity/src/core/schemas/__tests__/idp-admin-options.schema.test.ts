/**
 * Stackra file contract:
 * Purpose: unit tests of `IdpAdminOptions` and `IdpAdminConfig`: the shape is registered with the shipped schema, its
 *          initializers equal the shipped defaults (no URL, no token, 15 seconds), the URL is absolute or unset, and the
 *          token and the events signing key are filled from their secrets.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26); ADR 0173; ADR 0410.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { describe, expect, it } from "@stackra/testing";
import { Schema, schemaOf } from "@stackra/validation";

import { IdpAdminConfig } from "#config/idp-admin.config";
import { IDP_ADMIN_CONFIG_SCHEMA } from "#core/constants/idp-admin-config-schema.constant";
import { IdpAdminOptions } from "#core/schemas/idp-admin-options.schema";

describe("IdpAdminOptions", () => {
  it("is a shape registered with the shipped schema, with equal defaults", () => {
    expect(new IdpAdminOptions()).toBeInstanceOf(Schema);
    expect(schemaOf(IdpAdminOptions)).toBe(IDP_ADMIN_CONFIG_SCHEMA);
    expect({ ...new IdpAdminOptions() }).toEqual(IDP_ADMIN_CONFIG_SCHEMA.parse({}));
  });

  it("takes an absolute URL or none", () => {
    expect(IDP_ADMIN_CONFIG_SCHEMA.parse({ url: "https://id.acme.example" }).url).toBe(
      "https://id.acme.example",
    );
    expect(IDP_ADMIN_CONFIG_SCHEMA.safeParse({ url: "id.acme.example" }).success).toBe(false);
    expect(IDP_ADMIN_CONFIG_SCHEMA.safeParse({ timeoutSeconds: 0 }).success).toBe(false);
  });

  it("fills the token from its secret", () => {
    const secrets = new (class extends SecretStore {
      get(name: string): string | undefined {
        return name === "IDENTITY_IDP_ADMIN_TOKEN" ? "pat_1" : undefined;
      }
    })();
    expect(buildConfig(IdpAdminConfig, { secrets }).token).toBe("pat_1");
  });

  it("fills the events signing key from its secret (STA-1579)", () => {
    const secrets = new (class extends SecretStore {
      get(name: string): string | undefined {
        return name === "IDENTITY_IDP_EVENTS_SIGNING_KEY" ? "key_1" : undefined;
      }
    })();
    expect(buildConfig(IdpAdminConfig, { secrets }).eventsSigningKey).toBe("key_1");
  });
});
