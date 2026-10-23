/**
 * Stackra file contract:
 * Purpose: proves the configuration of @stackra/tokens starts from its defaults and that a host subclass changes a
 *          value by overriding it.
 * Boundary: constructs config objects only.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 19); ADR 0022 (test placement).
 */
import { TokensConfig } from "#config/tokens.config";

describe("TokensConfig", () => {
  it("starts enabled", () => {
    expect(new TokensConfig().enabled).toBe(true);
  });

  it("takes a host override", () => {
    class HostConfig extends TokensConfig {
      override enabled = false;
    }
    expect(new HostConfig().enabled).toBe(false);
  });
});
