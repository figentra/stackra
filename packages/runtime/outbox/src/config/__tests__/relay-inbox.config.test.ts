/**
 * Stackra file contract:
 * Purpose: unit tests of `RelayInboxConfig`: a configuration keyed `outbox.relay_inbox`, running in `dev` with no
 *          producer by default, that takes the pinned producers' key table and refuses an empty environment.
 * Boundary: test only; builds the configuration through @stackra/config.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0511 (decisions 16 and 18); ADR 0294 (decisions 19 and 20).
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { RelayInboxConfig } from "#config/relay-inbox.config";
import { RELAY_INBOX_CONFIG_SCHEMA } from "#core/constants/relay-inbox-config-schema.constant";

describe("RelayInboxConfig", () => {
  it("is a configuration keyed outbox.relay_inbox, in dev with no producer by default", () => {
    expect(new RelayInboxConfig()).toBeInstanceOf(Config);
    expect(configKey(RelayInboxConfig, "outbox")).toBe("outbox.relay_inbox");
    const config = buildConfig(RelayInboxConfig);
    expect({ ...config }).toEqual(RELAY_INBOX_CONFIG_SCHEMA.parse({}));
    expect(config.environment).toBe("dev");
    expect(config.producers).toEqual({});
  });

  it("takes the pinned producers' keys and refuses an empty environment", () => {
    const producers = { pay: { prod: [{ id: "pay-prod-1", publicKey: "AAAA" }] } };
    const config = buildConfig(RelayInboxConfig, { values: { environment: "prod", producers } });
    expect(config.producers).toEqual(producers);
    expect(() => buildConfig(RelayInboxConfig, { values: { environment: "" } })).toThrow(
      ConfigInvalidError,
    );
  });
});
