/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/skills until `stackra gen` writes the entry barrels (STA-339):
 *          the neutral agent document format (its kinds, the hook events, the parser, its error and the document
 *          types) that the renderers and `stackra agents` read.
 * Boundary: names each re-export and declares nothing. The frontmatter schemas, the splitter and the name derivation
 *           stay internal; reading the bundled documents from disk is `./node`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0282 (decision 2).
 */
export { AgentDocumentKind } from "#core/enums/agent-document-kind.enum";
export { HookEvent } from "#core/enums/hook-event.enum";
export { AgentDocumentInvalidError } from "#core/errors/agent-document-invalid.error";
export { parseAgentDocument } from "#core/functions/parse-agent-document.function";
export type { AgentDocument } from "#core/types/agent-document.type";
export type { CommandDocument } from "#core/types/command-document.type";
export type { DocumentIssue } from "#core/types/document-issue.type";
export type { HookDocument } from "#core/types/hook-document.type";
export type { RuleDocument } from "#core/types/rule-document.type";
export type { SkillDocument } from "#core/types/skill-document.type";
export type { SubagentDocument } from "#core/types/subagent-document.type";
