/**
 * Stackra file contract:
 * Purpose: `AgentDocument`, any parsed agent document, told apart by `kind`.
 * Boundary: type only; the union of the five kind types.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decision 2).
 */
import type { CommandDocument } from "#core/types/command-document.type";
import type { HookDocument } from "#core/types/hook-document.type";
import type { RuleDocument } from "#core/types/rule-document.type";
import type { SkillDocument } from "#core/types/skill-document.type";
import type { SubagentDocument } from "#core/types/subagent-document.type";

/** One parsed document of any kind. */
export type AgentDocument =
  | SkillDocument
  | RuleDocument
  | SubagentDocument
  | CommandDocument
  | HookDocument;
