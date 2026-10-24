/**
 * Stackra file contract:
 * Purpose: unit tests of `AgentDocumentKind`: the five kinds ADR 0282 names, in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 2).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { AgentDocumentKind } from "#core/enums/agent-document-kind.enum";

describe("AgentDocumentKind", () => {
  it("lists skill, rule, subagent, command and hook", () => {
    expect(Enum.values(AgentDocumentKind)).toEqual([
      "skill",
      "rule",
      "subagent",
      "command",
      "hook",
    ]);
    expect(AgentDocumentKind.Subagent).toBe("subagent");
    expectTypeOf<AgentDocumentKind>().toEqualTypeOf<
      "skill" | "rule" | "subagent" | "command" | "hook"
    >();
  });
});
