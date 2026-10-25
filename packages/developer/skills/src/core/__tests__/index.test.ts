/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the neutral format's kinds, hook events, parser and error are
 *          exported, nothing else is (the schemas, the splitter and the name derivation stay internal), and the public
 *          types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as skills from "#core/index";
import type {
  AgentDocument,
  CommandDocument,
  DocumentIssue,
  HookDocument,
  RuleDocument,
  SkillDocument,
  SubagentDocument,
} from "#core/index";

describe("@stackra/skills", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(skills).sort()).toEqual([
      "AgentDocumentInvalidError",
      "AgentDocumentKind",
      "HookEvent",
      "parseAgentDocument",
    ]);
  });

  it("resolves its public types", () => {
    expectTypeOf<AgentDocument>().toEqualTypeOf<
      SkillDocument | RuleDocument | SubagentDocument | CommandDocument | HookDocument
    >();
    expectTypeOf<AgentDocument["kind"]>().toEqualTypeOf<skills.AgentDocumentKind>();
    expectTypeOf<DocumentIssue>().toEqualTypeOf<{
      readonly path: string;
      readonly message: string;
    }>();
  });
});
