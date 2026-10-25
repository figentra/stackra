/**
 * Stackra file contract:
 * Purpose: unit tests of `emitBlocks`: one `registerBlocks` call per client runtime that draws a block, each row with
 *          the block's `<member>.<folder>` key, its class and the component beside it; a runtime with no component
 *          gets no file, and a member that is not an app gets none.
 * Boundary: test only; runs on the IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0270 (decision 3); ADR 0294 (decisions 20 and 22).
 */
import { describe, expect, it } from "@stackra/testing";

import { emitBlocks } from "#core/functions/emit-blocks.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";

describe("emitBlocks", () => {
  it("registers each block a runtime can draw", () => {
    const [browser, ...rest] = emitBlocks(WEB_APP_IR);
    expect(rest).toEqual([]);
    expect(browser?.path).toBe(".stackra/gen/blocks/browser.ts");
    expect(browser?.content).toContain('import { registerBlocks } from "@stackra/experience";');
    expect(browser?.content).toContain(
      'import { CtaBannerBlock } from "#blocks/cta-banner/cta-banner.block";',
    );
    expect(browser?.content).toContain(
      'import { CtaBanner } from "#blocks/cta-banner/cta-banner";',
    );
    expect(browser?.content).toContain(
      'registerBlocks([\n  { key: "web.cta_banner", block: CtaBannerBlock, component: CtaBanner },\n]);',
    );
  });

  it("writes nothing for a member that is not an app", () => {
    expect(emitBlocks(COMMERCE_IR)).toEqual([]);
  });
});
