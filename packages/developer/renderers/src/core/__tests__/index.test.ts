/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: `Assistant`, `RenderInputError` and `renderAssistant` are the only
 *          values; the per-assistant renderers, the maps and the Markdown helpers are not exported.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as renderers from "#core/index";
import type { RenderedFile, RenderResult, SkippedDocument } from "#core/index";

describe("@stackra/renderers", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(renderers).sort()).toEqual([
      "Assistant",
      "RenderInputError",
      "renderAssistant",
    ]);
  });

  it("types the result as files and skipped documents", () => {
    expectTypeOf(renderers.renderAssistant).returns.toEqualTypeOf<RenderResult>();
    expectTypeOf<RenderResult["files"]>().toEqualTypeOf<readonly RenderedFile[]>();
    expectTypeOf<RenderResult["skipped"]>().toEqualTypeOf<readonly SkippedDocument[]>();
  });
});
