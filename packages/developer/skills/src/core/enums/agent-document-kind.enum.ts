/**
 * Stackra file contract:
 * Purpose: the five kinds of agent document the neutral format holds: a skill, a rule, a sub-agent, a command and a
 *          hook. Each is written once as Markdown with frontmatter and rendered into every assistant's own layout.
 * Boundary: an `Enum.of` value plus the type of the same name. Where each kind sits on disk is the loader's
 *           (`./node`).
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decision 2), ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** One case per kind of agent document. */
export const AgentDocumentKind = Enum.of({
  /** An invocable skill: `skills/<name>/SKILL.md`, with any supporting files beside it. */
  Skill: "skill",
  /** A rule: always on, scoped to file globs, or read on request. */
  Rule: "rule",
  /** A sub-agent definition: a mission and the tools it may use. */
  Subagent: "subagent",
  /** A command the user types (a slash command). */
  Command: "command",
  /** A hook: a command line an assistant runs on one of its events. */
  Hook: "hook",
});

/** One of the codes above. */
export type AgentDocumentKind = Enum.Value<typeof AgentDocumentKind>;
