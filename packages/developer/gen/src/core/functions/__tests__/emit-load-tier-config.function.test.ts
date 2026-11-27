/**
 * Stackra file contract:
 * Purpose: unit tests of `emitLoadTierConfig`: one file, `.stackra/vitest.load.config.ts`, that wraps the generated unit
 *          config in `loadTier` from `@stackra/vitest-config/load` and names the member in its header.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0295 (decision 5); ADR 0182; STA-317.
 */
import { describe, expect, it } from "@stackra/testing";

import { emitLoadTierConfig } from "#core/functions/emit-load-tier-config.function";

describe("emitLoadTierConfig", () => {
  const file = emitLoadTierConfig("@stackra/queue");

  it("writes the load config under .stackra/", () => {
    expect(file.path).toBe(".stackra/vitest.load.config.ts");
    expect(file.content).toContain("@stackra/queue");
  });

  it("narrows the generated unit config to the load tier", () => {
    expect(file.content).toContain('import { loadTier } from "@stackra/vitest-config/load";');
    expect(file.content).toContain('import config from "./vitest.config";');
    expect(file.content).toContain("export default loadTier(config);");
  });
});
