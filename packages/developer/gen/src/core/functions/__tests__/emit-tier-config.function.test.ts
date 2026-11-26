/**
 * Stackra file contract:
 * Purpose: unit tests of `emitTierConfig`: one file per tier, `.stackra/vitest.int.config.ts` or
 *          `.stackra/vitest.contract.config.ts`, that wraps the generated unit config in the tier's wrapper from
 *          `@stackra/vitest-config` (`intTier`, `contractTier`) and names the member in its header.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0295 (decision 5); ADR 0182; STA-1819; STA-2837.
 */
import { describe, expect, it } from "@stackra/testing";

import { emitTierConfig } from "#core/functions/emit-tier-config.function";

describe("emitTierConfig", () => {
  const int = emitTierConfig("@figentra/service-demo", "int");
  const contract = emitTierConfig("@figentra/service-demo", "contract");

  it("writes each tier's config under .stackra/", () => {
    expect(int.path).toBe(".stackra/vitest.int.config.ts");
    expect(contract.path).toBe(".stackra/vitest.contract.config.ts");
    expect(int.content).toContain("@figentra/service-demo");
    expect(contract.content).toContain("@figentra/service-demo");
  });

  it("narrows the generated unit config to the integration tier", () => {
    expect(int.content).toContain('import { intTier } from "@stackra/vitest-config/int";');
    expect(int.content).toContain('import config from "./vitest.config";');
    expect(int.content).toContain("export default intTier(config);");
    expect(int.content).toContain("one file after another; run by `stackra test --tier int`.");
  });

  it("narrows the generated unit config to the contract tier", () => {
    expect(contract.content).toContain(
      'import { contractTier } from "@stackra/vitest-config/contract";',
    );
    expect(contract.content).toContain('import config from "./vitest.config";');
    expect(contract.content).toContain("export default contractTier(config);");
    expect(contract.content).toContain(
      "`__tests__/`, files in parallel; run by `stackra test --tier",
    );
    expect(contract.content).not.toContain("intTier");
  });
});
