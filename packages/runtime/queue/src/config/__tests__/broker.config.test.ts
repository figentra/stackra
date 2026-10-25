/**
 * Stackra file contract:
 * Purpose: unit tests of `BrokerConfig`, `BrokerOptions` and `BROKER_CONFIG_SCHEMA`: keyed `queue.broker`, defaults
 *          equal to the initializers, `driver` typed and closed to the shipped publishers, and the Valkey URL filled
 *          only from its secret.
 * Boundary: test only; the URL is made up.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 4, 19, 20 and 26); ADR 0173.
 */
import { buildConfig, ConfigInvalidError, configKey } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import type { DriverName } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { BrokerConfig } from "#config/broker.config";
import type { BrokerPublisher } from "#contracts/index";
import { BROKER_CONFIG_SCHEMA } from "#core/constants/broker-config-schema.constant";
import { BROKER_PUBLISHERS } from "#core/constants/broker-publishers.constant";
import { BrokerOptions } from "#core/schemas/broker-options.schema";

describe("BrokerConfig", () => {
  it("is keyed queue.broker with the shipped defaults", () => {
    expect(configKey(BrokerConfig, "queue")).toBe("queue.broker");
    expect(schemaOf(BrokerOptions)).toBe(BROKER_CONFIG_SCHEMA);
    expect(BROKER_CONFIG_SCHEMA.parse({})).toEqual({
      driver: "memory",
      valkeyUrl: "",
      valkey: { keyPrefix: "broker:", maxLength: 100_000 },
    });
    expect(buildConfig(BrokerConfig).driver).toBe("memory");
    expect([...BROKER_PUBLISHERS]).toEqual(["memory", "topic", "valkey"]);
  });

  it("types and closes the driver names", () => {
    expectTypeOf<DriverName<BrokerPublisher>>().toEqualTypeOf<"memory" | "topic" | "valkey">();
    expect(() =>
      buildConfig(BrokerConfig, { values: { driver: "kafka" as DriverName<BrokerPublisher> } }),
    ).toThrow(ConfigInvalidError);
  });

  it("fills the Valkey URL from its secret only", () => {
    const secrets = new (class extends SecretStore {
      get(name: string): string | undefined {
        return name === "QUEUE_BROKER_VALKEY_URL" ? "redis://valkey.test" : undefined;
      }
    })();
    expect(buildConfig(BrokerConfig, { secrets }).valkeyUrl).toBe("redis://valkey.test");
  });
});
