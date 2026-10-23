/**
 * Stackra file contract:
 * Purpose: proves the configuration of @figentra/service-{{NAME}} starts from its defaults.
 * Boundary: constructs a config object only.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 19); ADR 0022 (test placement).
 */
import { {{PASCAL}}Config } from "#config/{{NAME}}.config";

describe("{{PASCAL}}Config", () => {
  it("starts enabled", () => {
    expect(new {{PASCAL}}Config().enabled).toBe(true);
  });
});
