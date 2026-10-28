/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the generated wiring imports `Renderer`, the document
 *          format (`DocumentNode`, `BlockEvent`, `BlockEventHandlers`, `RenderContext`), the document kinds
 *          (`ExperienceKind`) and the validator's `DocumentProblem` are typed here; nothing else is exported.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import type { Json } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type {
  BlockEvent,
  BlockEventHandlers,
  DocumentNode,
  DocumentProblem,
  RenderContext,
} from "#contracts/index";

describe("@stackra/experience/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual(["ExperienceKind", "Renderer"]);
  });

  it("types the document format", () => {
    expectTypeOf<DocumentNode["id"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<DocumentNode["block"]>().toEqualTypeOf<string>();
    expectTypeOf<DocumentNode["input"]>().toEqualTypeOf<Json | undefined>();
    expectTypeOf<BlockEvent["verb"]>().toEqualTypeOf<"navigate" | "action">();
    expectTypeOf<RenderContext>().toMatchTypeOf<BlockEventHandlers>();
    expectTypeOf<RenderContext["locale"]>().toEqualTypeOf<string>();
  });

  it("types the document kinds and the validator's problems", () => {
    expectTypeOf<contracts.ExperienceKind>().toEqualTypeOf<
      | "page"
      | "screen"
      | "form"
      | "email_template"
      | "print_document"
      | "theme_section"
      | "dashboard"
    >();
    expectTypeOf<DocumentProblem["path"]>().toEqualTypeOf<string>();
    expectTypeOf<DocumentProblem["props"]>().toEqualTypeOf<readonly string[] | undefined>();
  });
});
