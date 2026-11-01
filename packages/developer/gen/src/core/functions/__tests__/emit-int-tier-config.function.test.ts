/**
 * Stackra file contract:
 * Purpose: unit tests of `emitIntTierConfig`: one file, `.stackra/vitest.int.config.ts`, that wraps the generated unit
 *          config in `intTier` from `@stackra/vitest-config/int` and names the member in its header.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0295 (decision 5); ADR 0182; STA-1819.
 */
import { describe, expect, it } from "@stackra/testing";

import { emitIntTierConfig } from "#core/functions/emit-int-tier-config.function";

describe("emitIntTierConfig", () => {
  const file = emitIntTierConfig("@figentra/service-demo");

  it("writes the int config under .stackra/", () => {
    expect(file.path).toBe(".stackra/vitest.int.config.ts");
    expect(file.content).toContain("@figentra/service-demo");
  });

  it("narrows the generated unit config to the integration tier", () => {
    expect(file.content).toContain('import { intTier } from "@stackra/vitest-config/int";');
    expect(file.content).toContain('import config from "./vitest.config";');
    expect(file.content).toContain("export default intTier(config);");
  });
});
