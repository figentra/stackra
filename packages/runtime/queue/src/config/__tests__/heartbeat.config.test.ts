/**
 * Stackra file contract:
 * Purpose: unit tests of `HeartbeatConfig`, `HeartbeatOptions` and `HEARTBEAT_CONFIG_SCHEMA`: keyed `queue.heartbeat`,
 *          defaults equal to the initializers, the URLs filled only from the `STACKRA_HEARTBEAT_URLS` secret, a malformed
 *          secret refused without echoing it, and the gap and the timeout bounded.
 * Boundary: test only; the URLs are made up.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 4, 19, 20 and 26); ADR 0173; ADR 0184 (decision 4).
 */
import { buildConfig, ConfigInvalidError, configKey } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { Schema, schemaOf } from "@stackra/validation";

import { HeartbeatConfig } from "#config/heartbeat.config";
import { HEARTBEAT_CONFIG_SCHEMA } from "#core/constants/heartbeat-config-schema.constant";
import { HeartbeatOptions } from "#core/schemas/heartbeat-options.schema";

const URL_A = "https://uptime.example.test/api/v1/heartbeat/secret-token-a";

/** A secret store holding `STACKRA_HEARTBEAT_URLS` = `value`. */
const secretsOf = (value: string): SecretStore =>
  new (class extends SecretStore {
    get(name: string): string | undefined {
      return name === "STACKRA_HEARTBEAT_URLS" ? value : undefined;
    }
  })();

describe("HeartbeatConfig", () => {
  it("is keyed queue.heartbeat with the shipped defaults", () => {
    expect(configKey(HeartbeatConfig, "queue")).toBe("queue.heartbeat");
    expect(new HeartbeatOptions()).toBeInstanceOf(Schema);
    expect(schemaOf(HeartbeatOptions)).toBe(HEARTBEAT_CONFIG_SCHEMA);
    expect({ ...new HeartbeatOptions() }).toEqual(HEARTBEAT_CONFIG_SCHEMA.parse({}));
    expect(HEARTBEAT_CONFIG_SCHEMA.parse({})).toEqual({
      urls: "",
      minInterval: "PT10S",
      timeout: "PT3S",
    });
    expect(buildConfig(HeartbeatConfig).urls).toBe("");
  });

  it("fills the URLs from their secret only", () => {
    const value = JSON.stringify({ "outbox-relay": URL_A });
    expect(buildConfig(HeartbeatConfig, { secrets: secretsOf(value) }).urls).toBe(value);
  });

  it("refuses a malformed secret without echoing it", () => {
    for (const value of [
      "not json",
      "[]",
      JSON.stringify({ "outbox-relay": "http://uptime.example.test/secret-token-a" }),
      JSON.stringify({ Outbox_Relay: URL_A }),
      JSON.stringify({ "outbox-relay": 7 }),
    ]) {
      let refusal: unknown;
      try {
        buildConfig(HeartbeatConfig, { secrets: secretsOf(value) });
      } catch (error) {
        refusal = error;
      }
      expect(refusal).toBeInstanceOf(ConfigInvalidError);
      expect(JSON.stringify(refusal)).not.toContain("secret-token-a");
      expect(String((refusal as Error).message)).not.toContain("secret-token-a");
    }
  });

  it("bounds the gap and the timeout", () => {
    expect(
      buildConfig(HeartbeatConfig, {
        values: { minInterval: Duration.seconds(1), timeout: Duration.parse("100ms") },
      }).minInterval,
    ).toBe("PT1S");
    for (const values of [
      { minInterval: Duration.seconds(11) },
      { minInterval: Duration.parse("500ms") },
      { timeout: Duration.seconds(11) },
      { timeout: Duration.parse("50ms") },
    ])
      expect(() => buildConfig(HeartbeatConfig, { values })).toThrow(ConfigInvalidError);
  });
});
