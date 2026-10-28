/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the template imports `Block`, `BlockCategory` and the
 *          `BlockProps` type (`LocalizedText` is `@stackra/contracts`', STA-1383); the wiring adds `registerBlocks`,
 *          the builder `registeredBlocks`, the validator and its two refusals, the server-side validator and the theme revisions complete it;
 *          nothing else is exported.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import type { LocalizedText } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { ExperienceKind } from "#contracts/enums/experience-kind.enum";
import type { DocumentProblem } from "#contracts/types/document-problem.type";
import * as core from "#core/index";
import type {
  BlockEntry,
  BlockOptions,
  ResolvedNode,
  Theme,
  ThemeChange,
  ThemeDiff,
  ThemeRevision,
  ValidateDocumentOptions,
} from "#core/index";

describe("@stackra/experience", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(core).sort()).toEqual([
      "Block",
      "BlockCategory",
      "InvalidDocumentError",
      "UnknownBlockError",
      "blockKinds",
      "commitTheme",
      "diffTheme",
      "registerBlocks",
      "registeredBlocks",
      "resolveDocument",
      "rollbackTheme",
      "validateDocument",
      "validateTheme",
    ]);
  });

  it("exports the types the template, the wiring and the renderers use", () => {
    expectTypeOf<LocalizedText>().toEqualTypeOf<Readonly<Record<string, string>>>();
    expectTypeOf<BlockOptions["category"]>().toEqualTypeOf<core.BlockCategory>();
    expectTypeOf<BlockEntry["key"]>().toEqualTypeOf<string>();
    expectTypeOf<ResolvedNode["path"]>().toEqualTypeOf<string>();
  });

  it("types the server-side validator and the theme revisions", () => {
    expectTypeOf<BlockOptions["kinds"]>().toEqualTypeOf<readonly ExperienceKind[] | undefined>();
    expectTypeOf<ValidateDocumentOptions["kind"]>().toEqualTypeOf<ExperienceKind>();
    expectTypeOf(core.validateDocument).returns.toEqualTypeOf<DocumentProblem[]>();
    expectTypeOf(core.commitTheme).returns.toEqualTypeOf<readonly ThemeRevision[]>();
    expectTypeOf(core.rollbackTheme).parameter(2).toEqualTypeOf<ThemeChange>();
    expectTypeOf(core.diffTheme).returns.toEqualTypeOf<ThemeDiff>();
    expectTypeOf<ThemeRevision["theme"]>().toEqualTypeOf<Theme>();
  });
});
