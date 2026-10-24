/**
 * Stackra file contract:
 * Purpose: `KIND_FOLDERS`, the folder each agent document kind sits in under a skill set root: `skills/<name>/SKILL.md`,
 *          and `rules/`, `subagents/`, `commands/` and `hooks/` holding `<name>.md` files.
 * Boundary: internal; `loadSkillSet` is the one reader. A folder's `README.md` is documentation, never a document.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 2).
 */
import type { AgentDocumentKind } from "#core/enums/agent-document-kind.enum";

/** The folder of each kind, relative to the skill set root. */
export const KIND_FOLDERS = {
  skill: "skills",
  rule: "rules",
  subagent: "subagents",
  command: "commands",
  hook: "hooks",
} as const satisfies Record<AgentDocumentKind, string>;
