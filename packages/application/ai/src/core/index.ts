/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/ai, which has several public files, until `stackra gen` writes
 *          the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The one entry serves the module's `ai/` group, the generated
 *           tool table and the service that calls a model.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note; the STA-347 stand-in barrel decision.
 */
export { Facts } from "#core/bases/facts.base";
export { Prompt } from "#core/bases/prompt.base";
export { Skill } from "#core/bases/skill.base";
export { Approval } from "#core/enums/approval.enum";
export { ToolSource } from "#core/enums/tool-source.enum";
export { approvalFor } from "#core/functions/approval-for.function";
export { decide } from "#core/functions/decide.function";
export type { ContextFacts } from "#core/types/context-facts.type";
export type { DecideOptions } from "#core/types/decide-options.type";
export type { FactsContext } from "#core/types/facts-context.type";
export type { PromptClass } from "#core/types/prompt-class.type";
export type { PromptOptions } from "#core/types/prompt-options.type";
export type { SkillClass } from "#core/types/skill-class.type";
export type { SkillExample } from "#core/types/skill-example.type";
export type { SkillOptions } from "#core/types/skill-options.type";
