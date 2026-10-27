/**
 * Stackra file contract:
 * Purpose: proves the configuration of @stackra-pro/ui starts from its defaults and that a host subclass changes a
 *          value by overriding it.
 * Boundary: constructs config objects only.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 19); ADR 0022 (test placement).
 */
import { Config } from "@stackra/config";

import { UiProConfig } from "#config/ui-pro.config";

describe("UiProConfig", () => {
  it("is a configuration that starts enabled", () => {
    expect(new UiProConfig()).toBeInstanceOf(Config);
    expect(new UiProConfig().enabled).toBe(true);
  });

  it("takes a host override", () => {
    class HostConfig extends UiProConfig {
      override enabled = false;
    }
    expect(new HostConfig().enabled).toBe(false);
  });
});
