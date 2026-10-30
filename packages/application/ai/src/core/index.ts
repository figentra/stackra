/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/ai, which has several public files, until `stackra gen` writes
 *          the entry barrels (STA-339): the kinds, the tool-table vocabulary, `decide` and `retrieve`, the approval-mode
 *          resolver with the permission matrix, the model router, the context allow-list and redaction, budgets,
 *          guardrails (the layered check, `GuardrailBlockedError`, and its pattern, PII, prompt-injection and model-classifier drivers), evals
 *          and intents, the token meter (`AiMeter`, `AI_METERS`), the `ModelProviders` token, and the agent runtime
 *          (`Agent`, `Promptable`, `AgentRuntime`, the memory stores), and the page reader drivers (memory,
 *          egress-bounded HTTP) with `checkEgress` and `parsePage`, and the client tool vocabulary of ADR 0490:
 *          `offerClientTools`, the page context (`PageContext`, `resolvePageContext`), `ClientResultInput` with
 *          `CLIENT_RESULT_ACTION`, and `ClientToolNotPendingError`.
 * Boundary: names each re-export and declares nothing. The one entry serves the module's `ai/` group, the generated
 *           tool table and the service that calls a model.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note; the STA-347 stand-in barrel decision; ADR 0360;
 *                     ADR 0450; ADR 0490.
 */
export { Agent } from "#core/bases/agent.base";
export { Facts } from "#core/bases/facts.base";
export { Prompt } from "#core/bases/prompt.base";
export { Promptable } from "#core/bases/promptable.base";
export { Skill } from "#core/bases/skill.base";
export { AI_METERS } from "#core/constants/ai-meters.constant";
export { CLIENT_RESULT_ACTION } from "#core/constants/client-result-action.constant";
export { CLIENT_TOOL_TIMEOUT_MS } from "#core/constants/client-tool-timeout.constant";
export { ClassifierGuardrailDriver } from "#core/drivers/classifier-guardrail.driver";
export { HttpPageReaderDriver } from "#core/drivers/http-page-reader.driver";
export { InjectionGuardrailDriver } from "#core/drivers/injection-guardrail.driver";
export { MemoryConversationStoreDriver } from "#core/drivers/memory-conversation-store.driver";
export { MemoryPageReaderDriver } from "#core/drivers/memory-page-reader.driver";
export { MemoryRunStoreDriver } from "#core/drivers/memory-run-store.driver";
export { PatternGuardrailDriver } from "#core/drivers/pattern-guardrail.driver";
export { PiiGuardrailDriver } from "#core/drivers/pii-guardrail.driver";
export { ActionPermission } from "#core/enums/action-permission.enum";
export { ApprovalMode } from "#core/enums/approval-mode.enum";
export { Approval } from "#core/enums/approval.enum";
export { GuardrailEffect } from "#core/enums/guardrail-effect.enum";
export { ToolSource } from "#core/enums/tool-source.enum";
export { ApprovalRequested } from "#core/events/approval-requested.event";
export { ApprovalResolved } from "#core/events/approval-resolved.event";
export { ClientToolNotPendingError } from "#core/errors/client-tool-not-pending.error";
export { GuardrailBlockedError } from "#core/errors/guardrail-blocked.error";
export { RunCompleted } from "#core/events/run-completed.event";
export { allowFields } from "#core/functions/allow-fields.function";
export { approvalFor } from "#core/functions/approval-for.function";
export { checkBudget } from "#core/functions/check-budget.function";
export { checkEgress } from "#core/functions/check-egress.function";
export { decide } from "#core/functions/decide.function";
export { offerClientTools } from "#core/functions/offer-client-tools.function";
export { parsePage } from "#core/functions/parse-page.function";
export { redact } from "#core/functions/redact.function";
export { resolveApproval } from "#core/functions/resolve-approval.function";
export { resolveModel } from "#core/functions/resolve-model.function";
export { resolvePageContext } from "#core/functions/resolve-page-context.function";
export { retrieve } from "#core/functions/retrieve.function";
export { routeIntent } from "#core/functions/route-intent.function";
export { routeModel } from "#core/functions/route-model.function";
export { runEvals } from "#core/functions/run-evals.function";
export { runGuardrails } from "#core/functions/run-guardrails.function";
export { GuardrailLayer } from "#core/ports/guardrail-layer.port";
export { ModelProviders } from "#core/ports/model-providers.port";
export { ClientResultInput } from "#core/schemas/client-result-input.schema";
export { ClientToolResult } from "#core/schemas/client-tool-result.schema";
export { PageContext } from "#core/schemas/page-context.schema";
export { PageContextModal } from "#core/schemas/page-context-modal.schema";
export { PageContextSelection } from "#core/schemas/page-context-selection.schema";
export { AgentRuntime } from "#core/services/agent-runtime.service";
export { AiMeter } from "#core/services/ai-meter.service";
export type { ActionPermissionRow } from "#core/types/action-permission-row.type";
export type { AgentClass } from "#core/types/agent-class.type";
export type { AgentDefinition } from "#core/types/agent-definition.type";
export type { AgentOptions } from "#core/types/agent-options.type";
export type { AgentReply } from "#core/types/agent-reply.type";
export type { AgentStream } from "#core/types/agent-stream.type";
export type { AiUsage } from "#core/types/ai-usage.type";
export type { ApprovalDecision } from "#core/types/approval-decision.type";
export type { ApprovalFloor } from "#core/types/approval-floor.type";
export type { ApprovalPolicy } from "#core/types/approval-policy.type";
export type { ApprovalPreferences } from "#core/types/approval-preferences.type";
export type { ApprovalRequest } from "#core/types/approval-request.type";
export type { ApprovalRules } from "#core/types/approval-rules.type";
export type { ApprovalStep } from "#core/types/approval-step.type";
export type { BudgetCheck } from "#core/types/budget-check.type";
export { ClassifierGuardrailOptions } from "#core/types/classifier-guardrail-options.type";
export type { ContextFacts } from "#core/types/context-facts.type";
export type { DataClassRule } from "#core/types/data-class-rule.type";
export type { DecideOptions } from "#core/types/decide-options.type";
export type { EvalCase } from "#core/types/eval-case.type";
export type { EvalReport } from "#core/types/eval-report.type";
export type { FactsContext } from "#core/types/facts-context.type";
export type { FieldAllowList } from "#core/types/field-allow-list.type";
export type { GuardrailStages } from "#core/types/guardrail-stages.type";
export type { GuardrailResult } from "#core/types/guardrail-result.type";
export type { GuardrailVerdict } from "#core/types/guardrail-verdict.type";
export type { Guardrail } from "#core/types/guardrail.type";
export { InjectionGuardrailOptions } from "#core/types/injection-guardrail-options.type";
export type { InjectionSignal } from "#core/types/injection-signal.type";
export type { Intent } from "#core/types/intent.type";
export type { ModelProviderDriver } from "#core/types/model-provider-driver.type";
export type { ModelRoute } from "#core/types/model-route.type";
export { PatternGuardrailOptions } from "#core/types/pattern-guardrail-options.type";
export type { PageContextSources } from "#core/types/page-context-sources.type";
export type { PageReaderPolicy } from "#core/types/page-reader-policy.type";
export { PiiGuardrailOptions } from "#core/types/pii-guardrail-options.type";
export type { PendingApproval } from "#core/types/pending-approval.type";
export type { PromptCall } from "#core/types/prompt-call.type";
export type { PromptClass } from "#core/types/prompt-class.type";
export type { PromptOptions } from "#core/types/prompt-options.type";
export type { QueuedRun } from "#core/types/queued-run.type";
export type { RedactionRule } from "#core/types/redaction-rule.type";
export type { RegionRule } from "#core/types/region-rule.type";
export type { ResumeDecision } from "#core/types/resume-decision.type";
export type { ResolvedPageContext } from "#core/types/resolved-page-context.type";
export type { ResolvedPageRecord } from "#core/types/resolved-page-record.type";
export type { RetrieveOptions } from "#core/types/retrieve-options.type";
export type { RetrievedPassage } from "#core/types/retrieved-passage.type";
export type { RouteChoice } from "#core/types/route-choice.type";
export type { RouteIntentOptions } from "#core/types/route-intent-options.type";
export type { RouteRequest } from "#core/types/route-request.type";
export type { RouteTable } from "#core/types/route-table.type";
export type { SkillClass } from "#core/types/skill-class.type";
export type { SkillExample } from "#core/types/skill-example.type";
export type { SkillOptions } from "#core/types/skill-options.type";
export type { TokenBudget } from "#core/types/token-budget.type";
