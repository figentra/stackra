/**
 * Stackra file contract:
 * Purpose: `renderCursor`, the Cursor layout of a document set: `rules/<name>.mdc` for every rule and skill (a skill and
 *          a rule read on request become agent-requested rules: a description, no globs, `alwaysApply: false`) and
 *          `commands/<name>.md` as plain Markdown.
 * Boundary: internal; pure. Paths are relative to `.cursor/`. `globs` is written comma-separated and unquoted, the form
 *           Cursor itself writes. Sub-agents and hooks are skipped.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decision 2: Cursor in `.cursor/rules`); ADR 0286 (decision 16: Cursor untested).
 */
import type { AgentDocument } from "@stackra/skills";

import { composeMarkdown } from "#core/functions/compose-markdown.function";
import { provenanceComment } from "#core/functions/provenance-comment.function";
import type { RenderResult } from "#core/types/render-result.type";
import type { RenderedFile } from "#core/types/rendered-file.type";
import type { SkippedDocument } from "#core/types/skipped-document.type";

/**
 * The Cursor files and the documents Cursor has no file for.
 *
 * @param documents - the documents, in any order.
 * @param generator - who generated the files.
 * @example
 * renderCursor([scopedRule], "stackra agents setup").files[0]?.path; // "rules/service-checklist.mdc"
 */
export function renderCursor(documents: readonly AgentDocument[], generator: string): RenderResult {
  const files: RenderedFile[] = [];
  const skipped: SkippedDocument[] = [];
  for (const document of documents) {
    const comment = provenanceComment(generator, `${document.kind} "${document.name}"`);
    switch (document.kind) {
      case "rule":
        files.push(
          ruleFile(
            document.name,
            document.description,
            document.globs,
            document.always,
            comment,
            document.body,
          ),
        );
        break;
      case "skill":
        files.push(
          ruleFile(document.name, document.description, [], false, comment, document.body),
        );
        break;
      case "command":
        files.push({
          path: `commands/${document.name}.md`,
          content: composeMarkdown(undefined, comment, document.body),
        });
        break;
      case "subagent":
        skipped.push({
          kind: document.kind,
          name: document.name,
          reason: "Cursor has no sub-agent file",
        });
        break;
      case "hook":
        skipped.push({
          kind: document.kind,
          name: document.name,
          reason:
            "Cursor hooks run on their own events, which the neutral hook events do not map to",
        });
        break;
    }
  }
  return { files, skipped };
}

/** An `.mdc` rule with Cursor's three frontmatter keys. */
function ruleFile(
  name: string,
  description: string,
  globs: readonly string[],
  always: boolean,
  comment: string,
  body: string,
): RenderedFile {
  const frontMatter = [
    `description: ${JSON.stringify(description)}`,
    `globs: ${globs.join(",")}`.trimEnd(),
    `alwaysApply: ${always}`,
  ].join("\n");
  return { path: `rules/${name}.mdc`, content: composeMarkdown(frontMatter, comment, body) };
}
