/**
 * Stackra file contract:
 * Purpose: tests of `CrossAppConfig`: keyed `outbox.cross_app`; its defaults send nothing across apps; the environment
 *          name comes from `STACKRA_ENVIRONMENT`; runway's values set the key id and the subscribers; an inbox origin
 *          must be https or loopback http; the signing key is a secret, refused from runway's values.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0511 (decisions 12, 16 and 17); ADR 0173.
 */
import { buildConfig, ConfigInvalidError, configKey } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { CrossAppConfig } from "#config/cross-app.config";
import { CROSS_APP_CONFIG_SCHEMA } from "#core/constants/cross-app-config-schema.constant";

const BILLING = {
  member: "billing",
  inbox: "https://billing.test",
  events: ["payments.payment.captured.v1"],
};

describe("CrossAppConfig", () => {
  it("is keyed outbox.cross_app and sends nothing by default", () => {
    expect(configKey(CrossAppConfig, "outbox")).toBe("outbox.cross_app");
    const config = buildConfig(CrossAppConfig);
    expect({ ...config }).toEqual(CROSS_APP_CONFIG_SCHEMA.parse({}));
    expect(config.environment).toBe("dev");
    expect(config.subscribers).toEqual([]);
  });

  // @covers sta-1910:FR-012
  it("takes the environment from STACKRA_ENVIRONMENT and the key id and subscribers from runway", () => {
    const config = buildConfig(CrossAppConfig, {
      env: { STACKRA_ENVIRONMENT: "staging" },
      values: { keyId: "pay-stg-1", subscribers: [BILLING] },
    });
    expect(config.environment).toBe("staging");
    expect(config.keyId).toBe("pay-stg-1");
    expect(config.subscribers).toEqual([BILLING]);
  });

  it("refuses an http inbox outside a loopback host", () => {
    expect(() =>
      buildConfig(CrossAppConfig, {
        values: { subscribers: [{ ...BILLING, inbox: "http://billing.test" }] },
      }),
    ).toThrow(ConfigInvalidError);
    expect(
      buildConfig(CrossAppConfig, {
        values: { subscribers: [{ ...BILLING, inbox: "http://localhost:4012" }] },
      }).subscribers,
    ).toHaveLength(1);
  });

  // @covers sta-1910:FR-015
  it("never takes the signing key from runway's values", () => {
    expect(() => buildConfig(CrossAppConfig, { values: { signingKey: "a-value" } })).toThrow(
      TypeError,
    );
  });
});
