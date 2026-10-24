/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: exactly the runtime surface is exported, every symbol the template
 *          imports from @stackra/ai resolves with the shape its commerce `ai/` group and generated tool table use, and
 *          the type exports resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0127 2026-10-24 note.
 */
import type { QueryContext } from "@stackra/actions";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as entry from "#core/index";
import type {
  ContextFacts,
  DecideOptions,
  FactsContext,
  PromptClass,
  PromptOptions,
  SkillClass,
  SkillExample,
  SkillOptions,
} from "#core/index";

describe("@stackra/ai", () => {
  it("exports exactly the runtime surface", () => {
    expect(Object.keys(entry).sort()).toEqual([
      "Approval",
      "Facts",
      "Prompt",
      "Skill",
      "ToolSource",
      "approvalFor",
      "decide",
    ]);
  });

  it("serves the template's generated tool table", () => {
    const tool = {
      key: "orders.order.cancel@1",
      class: "CancelOrderAction",
      name: "orders_order_cancel",
      from: entry.ToolSource.Action,
      risk: "L2",
      approval: entry.approvalFor("L2"),
    } as const;
    expect(tool.approval).toBe(entry.Approval.Confirm);
    expect(tool.from).toBe("action");
  });

  it("resolves the type exports", () => {
    expectTypeOf<ContextFacts>().toEqualTypeOf<{
      readonly summary: string;
      readonly facts: Readonly<Record<string, unknown>>;
    }>();
    expectTypeOf<FactsContext["authorize"]>().toEqualTypeOf<QueryContext["authorize"]>();
    expectTypeOf<FactsContext["money"]>().toEqualTypeOf<
      (minorUnits: number, currency: string) => string
    >();
    expectTypeOf<PromptOptions>().toEqualTypeOf<{ readonly version?: number }>();
    expectTypeOf<SkillOptions["tools"]>().toExtend<readonly unknown[]>();
    expectTypeOf<SkillExample["input"]>().toEqualTypeOf<string>();
    expectTypeOf<DecideOptions["prompt"]>().toEqualTypeOf<string>();
    expectTypeOf<PromptClass>().toEqualTypeOf<ReturnType<typeof entry.Prompt>>();
    expectTypeOf<SkillClass>().toEqualTypeOf<ReturnType<typeof entry.Skill>>();
  });
});
