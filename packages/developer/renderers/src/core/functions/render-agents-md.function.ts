/**
 * Stackra file contract:
 * Purpose: `renderAgentsMd`, one `AGENTS.md` for Codex, Gemini and every assistant that reads it: the always-on rules in
 *          full, then each file-scoped rule under the globs it applies to. Each rule's headings are pushed down two
 *          levels so they nest under the file's sections.
 * Boundary: internal; pure. Written only when the set holds an always-on or file-scoped rule. Skills, rules read on
 *           request, sub-agents, commands and hooks are skipped: `AGENTS.md` is read whole into every session, so it
 *           holds only what applies without being asked for.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decisions 2 and 10).
 */
import type { AgentDocument, RuleDocument } from "@stackra/skills";

import { demoteHeadings } from "#core/functions/demote-headings.function";
import { provenanceComment } from "#core/functions/provenance-comment.function";
import type { RenderResult } from "#core/types/render-result.type";
import type { SkippedDocument } from "#core/types/skipped-document.type";

/**
 * The `AGENTS.md` file, when there is a rule for it, and the documents it leaves out.
 *
 * @param documents - the documents, in any order; rules keep their input order within a section.
 * @param generator - who generated the file.
 * @example
 * renderAgentsMd([alwaysRule], "stackra agents setup").files[0]?.path; // "AGENTS.md"
 */
export function renderAgentsMd(
  documents: readonly AgentDocument[],
  generator: string,
): RenderResult {
  const always: RuleDocument[] = [];
  const scoped: RuleDocument[] = [];
  const skipped: SkippedDocument[] = [];
  for (const document of documents) {
    if (document.kind === "rule" && document.always) always.push(document);
    else if (document.kind === "rule" && document.globs.length > 0) scoped.push(document);
    else {
      skipped.push({
        kind: document.kind,
        name: document.name,
        reason: "AGENTS.md holds only always-on and file-scoped rules, read into every session",
      });
    }
  }
  if (always.length + scoped.length === 0) return { files: [], skipped };

  const count = always.length + scoped.length;
  const parts = [
    provenanceComment(generator, count === 1 ? "1 rule" : `${count} rules`),
    "# Rules",
    ...(always.length > 0 ? ["## Always", ...always.map((rule) => section(rule.body))] : []),
    ...(scoped.length > 0
      ? [
          "## When touching matching files",
          ...scoped.map(
            (rule) =>
              `When touching ${rule.globs.map((glob) => `\`${glob}\``).join(", ")}:\n\n${section(rule.body)}`,
          ),
        ]
      : []),
  ];
  return { files: [{ path: "AGENTS.md", content: `${parts.join("\n\n")}\n` }], skipped };
}

/** One rule body, trimmed, its headings under the file's `##` sections. */
function section(body: string): string {
  return demoteHeadings(body.replace(/^(?:[ \t]*\r?\n)+/, "").trimEnd(), 2);
}
