/**
 * Stackra file contract:
 * Purpose: unit tests of `ClientsConfig` and its shipped schema: keyed `clients`, the initializers equal the schema's
 *          defaults, a host override, a runway values layer, and refused values (a base URL that is no URL, a version
 *          that is no date, attempts out of range, a producer
 *          key that is no module key, a scope header that is no header name).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0146 (config classes); ADR 0294 (decision 26).
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { ClientsConfig } from "#config/clients.config";
import { CLIENTS_CONFIG_SCHEMA } from "#core/constants/clients-config-schema.constant";
import { ClientsOptions } from "#core/schemas/clients-options.schema";

const BaseClientsConfig = ClientsConfig;

/** The console's override. */
class ConsoleClientsConfig extends BaseClientsConfig {
  override baseUrl = "https://api.acme.example";

  override apiVersion = "2027-03-01";
}

describe("ClientsConfig", () => {
  it("is a configuration keyed clients", () => {
    expect(new ClientsConfig()).toBeInstanceOf(Config);
    expect(configKey(ConsoleClientsConfig, "clients")).toBe("clients");
  });

  it("has the schema's defaults as its initializers", () => {
    expect({ ...new ClientsOptions() }).toEqual(CLIENTS_CONFIG_SCHEMA.parse({}));
    expect(schemaOf(ClientsOptions)).toBe(CLIENTS_CONFIG_SCHEMA);
    expect({ ...buildConfig(ClientsConfig) }).toEqual({
      baseUrl: "",
      producers: {},
      scopeHeader: "X-Scope-Path",
      apiVersion: "",
      timeoutSeconds: 30,
      attempts: 3,
    });
  });

  it("applies a host override and a values layer", () => {
    const config = buildConfig(ConsoleClientsConfig, { values: { attempts: 1 } });
    expect(config.baseUrl).toBe("https://api.acme.example");
    expect(config.apiVersion).toBe("2027-03-01");
    expect(config.attempts).toBe(1);
  });

  it("refuses values outside their rules", () => {
    expect(() => buildConfig(ClientsConfig, { values: { baseUrl: "api.acme.example" } })).toThrow(
      ConfigInvalidError,
    );
    expect(() => buildConfig(ClientsConfig, { values: { apiVersion: "latest" } })).toThrow(
      ConfigInvalidError,
    );
    expect(() => buildConfig(ClientsConfig, { values: { attempts: 0 } })).toThrow(
      ConfigInvalidError,
    );
    expect(() =>
      buildConfig(ClientsConfig, { values: { producers: { Orders: "https://orders.example" } } }),
    ).toThrow(ConfigInvalidError);
    expect(() => buildConfig(ClientsConfig, { values: { scopeHeader: "X Scope" } })).toThrow(
      ConfigInvalidError,
    );
  });
});
