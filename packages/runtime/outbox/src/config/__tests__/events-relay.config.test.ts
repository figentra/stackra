/**
 * Stackra file contract:
 * Purpose: unit tests of `EventsRelayConfig`: a configuration keyed `outbox.events_relay`, empty by default (the
 *          default secret name, no key, no subscriber), that takes runway's `events` block and refuses a secret name
 *          that is not SCREAMING_SNAKE and an inbox that is not a URL.
 * Boundary: test only; builds the configuration through @stackra/config.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0511 (decisions 16 and 17); ADR 0294 (decisions 19 and 20).
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { EventsRelayConfig } from "#config/events-relay.config";
import { EVENTS_RELAY_CONFIG_SCHEMA } from "#core/constants/events-relay-config-schema.constant";

const SUBSCRIBER = {
  member: "billing",
  inbox: "https://billing.example.com",
  events: ["payments.payment.captured.v1"],
};

describe("EventsRelayConfig", () => {
  it("is a configuration keyed outbox.events_relay, empty by default", () => {
    expect(new EventsRelayConfig()).toBeInstanceOf(Config);
    expect(configKey(EventsRelayConfig, "outbox")).toBe("outbox.events_relay");
    const config = buildConfig(EventsRelayConfig);
    expect({ ...config }).toEqual(EVENTS_RELAY_CONFIG_SCHEMA.parse({}));
    expect(config.signingKey).toBe("STACKRA_EVENTS_SIGNING_KEY");
    expect(config.keys).toEqual([]);
    expect(config.subscribers).toEqual([]);
  });

  it("takes runway's events block", () => {
    const config = buildConfig(EventsRelayConfig, {
      values: { keys: [{ id: "pay-dev-1", publicKey: "AAAA" }], subscribers: [SUBSCRIBER] },
    });
    expect(config.subscribers).toEqual([SUBSCRIBER]);
  });

  it("refuses a secret name that is not SCREAMING_SNAKE and an inbox that is not a URL", () => {
    expect(() => buildConfig(EventsRelayConfig, { values: { signingKey: "a-value" } })).toThrow(
      ConfigInvalidError,
    );
    expect(() =>
      buildConfig(EventsRelayConfig, {
        values: { subscribers: [{ ...SUBSCRIBER, inbox: "billing" }] },
      }),
    ).toThrow(ConfigInvalidError);
  });
});
