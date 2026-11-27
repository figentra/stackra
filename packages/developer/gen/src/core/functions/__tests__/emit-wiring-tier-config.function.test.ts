/**
 * Stackra file contract:
 * Purpose: unit tests of `emitWiringTierConfig`: the wiring tier config is `.stackra/vitest.wiring.config.ts`, rooted
 *          at the member, on the decorators preset, running only the generated suite one file at a time, with no unit
 *          setup file.
 * Boundary: test only; pure output.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (decision 3); ADR 0295 (decision 5); STA-2838.
 */
import { describe, expect, it } from "@stackra/testing";

import { emitWiringTierConfig } from "#core/functions/emit-wiring-tier-config.function";

describe(emitWiringTierConfig, () => {
  const file = emitWiringTierConfig("@acme/service-commerce");

  it("writes the config beside the suite, running only the suite", () => {
    expect(file.path).toBe(".stackra/vitest.wiring.config.ts");
    for (const line of [
      'import { stackraVitestDecorators } from "@stackra/vitest-config/preset-decorators";',
      "export default mergeConfig(stackraVitestDecorators, {",
      '  root: fileURLToPath(new URL("..", import.meta.url)),',
      '    include: [".stackra/tests/encore-wiring.test.ts"],',
      "    fileParallelism: false,",
    ])
      expect(file.content).toContain(line);
    expect(file.content).toContain("@acme/service-commerce");
    expect(file.content).not.toContain("setupFiles");
  });
});
