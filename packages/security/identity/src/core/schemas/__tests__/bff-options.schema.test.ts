/**
 * Stackra file contract:
 * Purpose: unit tests of `BffOptions`, `BffConfig` and `BFF_CONFIG_SCHEMA`: the shape is registered with the shipped
 *          schema, its initializers equal the shipped defaults, a cookie name without `__Host-`, an origin with a path
 *          or a wildcard first origin is refused, and the secret and key are filled from their secrets.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26); ADR 0173; STA-1566.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { describe, expect, it } from "@stackra/testing";
import { Schema, schemaOf } from "@stackra/validation";

import { BffConfig } from "#config/bff.config";
import { BFF_CONFIG_SCHEMA } from "#core/constants/bff-config-schema.constant";
import { BffOptions } from "#core/schemas/bff-options.schema";

describe("BffOptions", () => {
  it("is a shape registered with the shipped schema, with equal defaults", () => {
    expect(new BffOptions()).toBeInstanceOf(Schema);
    expect(schemaOf(BffOptions)).toBe(BFF_CONFIG_SCHEMA);
    expect({ ...new BffOptions() }).toEqual(BFF_CONFIG_SCHEMA.parse({}));
    expect(BFF_CONFIG_SCHEMA.parse({})).toEqual({
      clientSecret: "",
      cookieKey: "",
      cookieName: "__Host-stackra_session",
      redirectUri: "",
      returnOrigins: [],
      postLogoutUri: "",
      sessionMinutes: 480,
      flowMinutes: 10,
    });
  });

  it("takes exact and wildcard return origins", () => {
    const origins = ["https://console.acme.example", "https://*.acme.example"];
    expect(BFF_CONFIG_SCHEMA.parse({ returnOrigins: origins }).returnOrigins).toEqual(origins);
  });

  it.each([
    ["a cookie name without __Host-", { cookieName: "stackra_session" }],
    ["an origin with a path", { returnOrigins: ["https://console.acme.example/app"] }],
    ["a wildcard first origin", { returnOrigins: ["https://*.acme.example"] }],
    ["a relative redirect URI", { redirectUri: "/api/auth/callback" }],
    ["a session under five minutes", { sessionMinutes: 1 }],
  ])("refuses %s", (_case, values) => {
    expect(BFF_CONFIG_SCHEMA.safeParse(values).success).toBe(false);
  });

  it("fills the client secret and cookie key from their secrets", () => {
    const secrets = new (class extends SecretStore {
      get(name: string): string | undefined {
        if (name === "IDENTITY_BFF_CLIENT_SECRET") return "client-secret";
        return name === "IDENTITY_BFF_COOKIE_KEY" ? "cookie-key" : undefined;
      }
    })();
    const config = buildConfig(BffConfig, { secrets });
    expect(config.clientSecret).toBe("client-secret");
    expect(config.cookieKey).toBe("cookie-key");
  });
});
