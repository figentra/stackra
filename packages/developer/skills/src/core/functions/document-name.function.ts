/**
 * Stackra file contract:
 * Purpose: `documentName`, the name of an agent document derived from its path: a skill is named by the folder that
 *          holds its `SKILL.md`, every other kind by its file name without `.md`.
 * Boundary: internal; returns the name or the issue, and `parseAgentDocument` decides. Accepts `/` and `\` separators.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decision 2); ADR 0294 (decision 20: identities are derived, not typed).
 */
import type { AgentDocumentKind } from "#core/enums/agent-document-kind.enum";
import type { DocumentIssue } from "#core/types/document-issue.type";

const KEBAB = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

/**
 * The derived name of the document at `source`, or why it has none.
 *
 * @example
 * documentName("skill", "assets/skills/backend-errors/SKILL.md"); // { name: "backend-errors" }
 * documentName("rule", "assets/rules/Naming.md"); // { issue: { path: "name", message: "…kebab-case…" } }
 */
export function documentName(
  kind: AgentDocumentKind,
  source: string,
): { name: string; issue?: undefined } | { name?: undefined; issue: DocumentIssue } {
  const segments = source.split(/[\\/]/).filter(Boolean);
  const file = segments.at(-1) ?? "";
  if (kind === "skill" && file !== "SKILL.md") {
    return {
      issue: { path: "", message: "A skill is a `SKILL.md` file inside a folder named after it" },
    };
  }
  if (!file.endsWith(".md")) {
    return { issue: { path: "", message: "An agent document is a `.md` file" } };
  }
  const name = kind === "skill" ? (segments.at(-2) ?? "") : file.slice(0, -".md".length);
  if (!KEBAB.test(name)) {
    return { issue: { path: "name", message: `"${name}" is not a kebab-case name` } };
  }
  return { name };
}
