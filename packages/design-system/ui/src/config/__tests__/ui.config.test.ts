/**
 * Stackra file contract:
 * Purpose: proves the configuration of @stackra/ui starts from its defaults and that a host subclass changes a
 *          value by overriding it.
 * Boundary: constructs config objects only.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 19); ADR 0022 (test placement).
 */
import { Config } from "@stackra/config";

import { UiConfig } from "#config/ui.config";

describe("UiConfig", () => {
  it("is a configuration that starts enabled", () => {
    expect(new UiConfig()).toBeInstanceOf(Config);
    expect(new UiConfig().enabled).toBe(true);
  });

  it("takes a host override", () => {
    class HostConfig extends UiConfig {
      override enabled = false;
    }
    expect(new HostConfig().enabled).toBe(false);
  });
});
