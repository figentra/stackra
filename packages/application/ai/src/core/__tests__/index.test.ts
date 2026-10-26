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
  ApprovalDecision,
  ApprovalFloor,
  ApprovalPolicy,
  ApprovalPreferences,
  ApprovalRequest,
  ApprovalRules,
  ApprovalStep,
  BudgetCheck,
  ContextFacts,
  DataClassRule,
  DecideOptions,
  EvalCase,
  EvalReport,
  FactsContext,
  FieldAllowList,
  Guardrail,
  GuardrailResult,
  GuardrailVerdict,
  Intent,
  ModelProviderDriver,
  ModelRoute,
  PromptClass,
  PromptOptions,
  RedactionRule,
  RegionRule,
  RetrieveOptions,
  RetrievedPassage,
  RouteChoice,
  RouteIntentOptions,
  RouteRequest,
  RouteTable,
  SkillClass,
  SkillExample,
  SkillOptions,
  TokenBudget,
} from "#core/index";

describe("@stackra/ai", () => {
  it("exports exactly the runtime surface", () => {
    expect(Object.keys(entry).sort()).toEqual([
      "ActionPermission",
      "Agent",
      "AgentRuntime",
      "Approval",
      "ApprovalMode",
      "Facts",
      "MemoryConversationStoreDriver",
      "MemoryRunStoreDriver",
      "Prompt",
      "Promptable",
      "Skill",
      "ToolSource",
      "allowFields",
      "approvalFor",
      "checkBudget",
      "decide",
      "redact",
      "resolveApproval",
      "resolveModel",
      "retrieve",
      "routeIntent",
      "routeModel",
      "runEvals",
      "runGuardrails",
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

  it("types the retrieval helper for Facts", () => {
    expectTypeOf<RetrievedPassage>().toEqualTypeOf<{
      readonly text: string;
      readonly source: string;
      readonly score: number;
    }>();
    expectTypeOf<RetrieveOptions["topK"]>().toEqualTypeOf<number>();
    expectTypeOf(entry.retrieve).returns.resolves.toEqualTypeOf<readonly RetrievedPassage[]>();
  });

  it("types the approval resolver and the model router", () => {
    expectTypeOf(entry.resolveApproval).returns.toEqualTypeOf<ApprovalDecision>();
    expectTypeOf<ApprovalDecision["step"]>().toEqualTypeOf<ApprovalStep>();
    expectTypeOf<ApprovalRules["floor"]>().toEqualTypeOf<ApprovalFloor>();
    expectTypeOf<ApprovalRules["policy"]>().toEqualTypeOf<ApprovalPolicy>();
    expectTypeOf<ApprovalRules["preferences"]>().toEqualTypeOf<ApprovalPreferences>();
    expectTypeOf(entry.resolveApproval).parameter(0).toEqualTypeOf<ApprovalRequest>();
    expectTypeOf(entry.routeModel).parameters.toEqualTypeOf<[RouteRequest, RouteTable]>();
    expectTypeOf(entry.routeModel).returns.toEqualTypeOf<RouteChoice>();
    expectTypeOf<RouteTable["routes"][number]>().toEqualTypeOf<ModelRoute>();
    expectTypeOf<RouteTable["regions"][number]>().toEqualTypeOf<RegionRule>();
    expectTypeOf<RouteTable["dataClasses"][number]>().toEqualTypeOf<DataClassRule>();
    expectTypeOf<ModelProviderDriver["provider"]>().toEqualTypeOf<string>();
  });

  it("types the context, budget, guardrail, eval and intent helpers", () => {
    expectTypeOf<FieldAllowList>().toEqualTypeOf<Readonly<Record<string, readonly string[]>>>();
    expectTypeOf<RedactionRule["pattern"]>().toEqualTypeOf<string>();
    expectTypeOf(entry.checkBudget).returns.toEqualTypeOf<BudgetCheck>();
    expectTypeOf<TokenBudget["warnAt"]>().toEqualTypeOf<number>();
    expectTypeOf(entry.runGuardrails).returns.resolves.toEqualTypeOf<GuardrailResult>();
    expectTypeOf<Guardrail["name"]>().toEqualTypeOf<string>();
    expectTypeOf<GuardrailVerdict>().toExtend<{ readonly pass: boolean }>();
    expectTypeOf(entry.runEvals<number, number>).returns.resolves.toEqualTypeOf<EvalReport>();
    expectTypeOf<EvalCase<string, boolean>["input"]>().toEqualTypeOf<string>();
    expectTypeOf<Intent["phrases"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<RouteIntentOptions["instructions"]>().toEqualTypeOf<string | undefined>();
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
