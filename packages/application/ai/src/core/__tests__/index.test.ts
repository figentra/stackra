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
  AiUsage,
  ApprovalDecision,
  ApprovalFloor,
  ApprovalPolicy,
  ApprovalPreferences,
  ApprovalRequest,
  ApprovalRules,
  ApprovalStep,
  BudgetCheck,
  ClassifierGuardrailOptions,
  ContextFacts,
  DataClassRule,
  DecideOptions,
  EvalCase,
  EvalReport,
  FactsContext,
  FieldAllowList,
  Guardrail,
  GuardrailResult,
  GuardrailStages,
  GuardrailVerdict,
  InjectionGuardrailOptions,
  InjectionSignal,
  Intent,
  ModelProviderDriver,
  ModelRoute,
  PageReaderPolicy,
  PatternGuardrailOptions,
  PiiGuardrailOptions,
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
      "AI_METERS",
      "ActionPermission",
      "Agent",
      "AgentRuntime",
      "AiMeter",
      "Approval",
      "ApprovalMode",
      "ApprovalRequested",
      "ApprovalResolved",
      "ClassifierGuardrailDriver",
      "Facts",
      "GuardrailEffect",
      "GuardrailLayer",
      "HttpPageReaderDriver",
      "InjectionGuardrailDriver",
      "MemoryConversationStoreDriver",
      "MemoryPageReaderDriver",
      "MemoryRunStoreDriver",
      "ModelProviders",
      "PatternGuardrailDriver",
      "PiiGuardrailDriver",
      "Prompt",
      "Promptable",
      "RunCompleted",
      "Skill",
      "ToolSource",
      "allowFields",
      "approvalFor",
      "checkBudget",
      "checkEgress",
      "decide",
      "parsePage",
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

  it("types the guardrail drivers and the token meter", () => {
    expectTypeOf<GuardrailStages["input"]>().toEqualTypeOf<entry.GuardrailEffect | undefined>();
    expectTypeOf<PatternGuardrailOptions["rules"]>().toEqualTypeOf<readonly RedactionRule[]>();
    expectTypeOf<PiiGuardrailOptions["rules"]>().toEqualTypeOf<readonly RedactionRule[]>();
    expectTypeOf<InjectionGuardrailOptions["signals"]>().toEqualTypeOf<
      readonly InjectionSignal[]
    >();
    expectTypeOf<InjectionSignal["weight"]>().toEqualTypeOf<number>();
    expectTypeOf<ClassifierGuardrailOptions["allowed"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<entry.GuardrailLayer>().toExtend<Guardrail>();
    expectTypeOf<entry.PatternGuardrailDriver>().toExtend<entry.GuardrailLayer>();
    expectTypeOf<entry.PiiGuardrailDriver>().toExtend<Guardrail>();
    expectTypeOf<entry.InjectionGuardrailDriver>().toExtend<Guardrail>();
    expectTypeOf<entry.ClassifierGuardrailDriver>().toExtend<Guardrail>();
    expectTypeOf<AiUsage["model"]>().toEqualTypeOf<string>();
    expect(entry.AI_METERS.input.name).toBe("ai.tokens");
  });

  it("types the page reader policy", () => {
    expectTypeOf<PageReaderPolicy["allowHosts"]>().toEqualTypeOf<readonly string[] | undefined>();
    expectTypeOf<PageReaderPolicy["maxBytes"]>().toEqualTypeOf<number>();
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
