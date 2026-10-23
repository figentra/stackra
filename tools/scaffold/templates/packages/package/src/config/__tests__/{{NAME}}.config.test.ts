/**
 * Stackra file contract:
 * Purpose: proves the configuration of @stackra/{{NAME}} starts from its defaults and that a host subclass changes a
 *          value by overriding it.
 * Boundary: constructs config objects only.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 19); ADR 0022 (test placement).
 */
import { {{PASCAL}}Config } from "#config/{{NAME}}.config";

describe("{{PASCAL}}Config", () => {
  it("starts enabled", () => {
    expect(new {{PASCAL}}Config().enabled).toBe(true);
  });

  it("takes a host override", () => {
    class HostConfig extends {{PASCAL}}Config {
      override enabled = false;
    }
    expect(new HostConfig().enabled).toBe(false);
  });
});
