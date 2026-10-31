/**
 * Stackra file contract:
 * Purpose: unit tests of `PaymentsConfig`: a configuration keyed `payments` that builds with the shipped defaults,
 *          takes a host override, and refuses an empty connection id.
 * Boundary: test only; pure configuration building, no container.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0146 as amended; ADR 0294 (decision 19); ADR 0370.
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { PaymentsConfig } from "#config/payments.config";
import { PAYMENTS_CONFIG_SCHEMA } from "#core/constants/payments-config-schema.constant";

/** A host override, under the plain name with the package class aliased. */
const BasePaymentsConfig = PaymentsConfig;

class HostPaymentsConfig extends BasePaymentsConfig {
  override platformConnections = { xa: { stripe: "conn_platform_stripe" } };
}

describe("PaymentsConfig", () => {
  it("is a configuration keyed payments that builds with the defaults", () => {
    expect(new PaymentsConfig()).toBeInstanceOf(Config);
    expect(configKey(PaymentsConfig, "payments")).toBe("payments");
    expect({ ...buildConfig(PaymentsConfig) }).toEqual(PAYMENTS_CONFIG_SCHEMA.parse({}));
  });

  it("takes a host override", () => {
    expect(buildConfig(HostPaymentsConfig).platformConnections).toEqual({
      xa: { stripe: "conn_platform_stripe" },
    });
  });

  it("refuses an empty connection id", () => {
    expect(() =>
      buildConfig(PaymentsConfig, { values: { platformConnections: { xa: { stripe: "" } } } }),
    ).toThrow(ConfigInvalidError);
  });
});
