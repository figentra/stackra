/**
 * Stackra file contract:
 * Purpose: proves the configuration of @stackra/navigation starts from its defaults and that a host subclass changes a
 *          value by overriding it.
 * Boundary: constructs config objects only.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 19); ADR 0022 (test placement).
 */
import { NavigationConfig } from "#config/navigation.config";

describe("NavigationConfig", () => {
  it("starts enabled", () => {
    expect(new NavigationConfig().enabled).toBe(true);
  });

  it("takes a host override", () => {
    class HostConfig extends NavigationConfig {
      override enabled = false;
    }
    expect(new HostConfig().enabled).toBe(false);
  });
});
