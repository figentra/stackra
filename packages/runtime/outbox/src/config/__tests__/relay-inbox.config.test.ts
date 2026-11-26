/**
 * Stackra file contract:
 * Purpose: unit tests of `RelayInboxConfig`: a configuration keyed `outbox.relay_inbox`, running in `dev` with no
 *          producer by default, that takes the pinned producers' keys and events, reads its environment from
 *          `STACKRA_ENVIRONMENT` only (a value for it is refused, STA-2844) and refuses an empty environment.
 * Boundary: test only; builds the configuration through @stackra/config.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0511 (decisions 16 and 18); ADR 0294 (decisions 19 and 20); ADR 0296
 *                     (amendment 2026-11-26).
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
    const producers = {
      pay: {
        keys: { production: [{ id: "pay-prod-1", publicKey: "AAAA" }] },
        events: ["payments.payment.captured.v1"],
      },
    };
    const config = buildConfig(RelayInboxConfig, {
      env: { STACKRA_ENVIRONMENT: "production" },
      values: { producers },
    });
    expect(config.environment).toBe("production");
    expect(config.producers).toEqual(producers);
    expect(() => buildConfig(RelayInboxConfig, { env: { STACKRA_ENVIRONMENT: "" } })).toThrow(
      ConfigInvalidError,
    );
  });

  it("reads its environment from the runtime only: a value or a misspelt name is refused (STA-2844)", () => {
    expect(() => buildConfig(RelayInboxConfig, { values: { environment: "production" } })).toThrow(
      /environment: is safety-critical/,
    );
    expect(() => buildConfig(RelayInboxConfig, { env: { STACKRA_ENVIRONMENT: "prod" } })).toThrow(
      /environment: is not a Stackra environment/,
    );
  });
});
