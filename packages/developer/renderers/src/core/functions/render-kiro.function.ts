/**
 * Stackra file contract:
 * Purpose: `renderKiro`, the Kiro layout of a document set: `skills/<name>/SKILL.md`, `steering/<name>.md` (inclusion
 *          `always`, `fileMatch` with the rule's globs, or `manual` for a rule read on request) and
 *          `agents/<name>.md` with the tools mapped through `KIRO_TOOLS`.
 * Boundary: internal; pure. Paths are relative to `.kiro/` or `~/.kiro/`. Commands and hooks are skipped: Kiro has no
 *           command file, and its hooks run on IDE events the neutral events do not map to.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decision 2); ADR 0286 (decisions 6 and 16: ported from Vellum, Kiro untested).
 */
import type { AgentDocument, RuleDocument } from "@stackra/skills";

import { KIRO_TOOLS } from "#core/constants/kiro-tools.constant";
import { RenderInputError } from "#core/errors/render-input.error";
import { composeMarkdown } from "#core/functions/compose-markdown.function";
import { provenanceComment } from "#core/functions/provenance-comment.function";
import type { RenderResult } from "#core/types/render-result.type";
import type { RenderedFile } from "#core/types/rendered-file.type";
import type { SkippedDocument } from "#core/types/skipped-document.type";

/**
 * The Kiro files and the documents Kiro has no file for.
 *
 * @param documents - the documents, in any order.
 * @param generator - who generated the files.
 * @throws RenderInputError when a sub-agent names a tool `KIRO_TOOLS` has no entry for.
 * @example
 * renderKiro([alwaysRule], "stackra agents setup").files[0]?.path; // "steering/versions.md"
 */
export function renderKiro(documents: readonly AgentDocument[], generator: string): RenderResult {
  const files: RenderedFile[] = [];
  const skipped: SkippedDocument[] = [];
  for (const document of documents) {
    const comment = provenanceComment(generator, `${document.kind} "${document.name}"`);
    switch (document.kind) {
      case "skill": {
        files.push({
          path: `skills/${document.name}/SKILL.md`,
          content: composeMarkdown(
            { name: document.name, description: document.description },
            comment,
            document.body,
          ),
        });
        break;
      }
      case "rule": {
        files.push({
          path: `steering/${document.name}.md`,
          content: composeMarkdown(inclusionOf(document), comment, document.body),
        });
        break;
      }
      case "subagent": {
        const unmapped = document.tools.filter((tool) => !Object.hasOwn(KIRO_TOOLS, tool));
        if (unmapped.length > 0) {
          throw new RenderInputError(
            "kiro",
            `subagent "${document.name}" names ${unmapped.join(", ")}, which KIRO_TOOLS does not map`,
          );
        }
        const tools = [
          ...new Set(
            document.tools
              .map((tool) => KIRO_TOOLS[tool])
              .filter((tool) => typeof tool === "string"),
          ),
        ];
        files.push({
          path: `agents/${document.name}.md`,
          content: composeMarkdown(
            {
              name: document.name,
              description: document.description,
              tools: document.tools.length > 0 ? tools : undefined,
            },
            comment,
            document.body,
          ),
        });
        break;
      }
      case "command": {
        skipped.push({
          kind: document.kind,
          name: document.name,
          reason: "Kiro has no command file",
        });
        break;
      }
      case "hook": {
        skipped.push({
          kind: document.kind,
          name: document.name,
          reason: "Kiro hooks run on IDE events, which the neutral hook events do not map to",
        });
        break;
      }
    }
  }
  return { files, skipped };
}

/** The steering frontmatter: always, on matching files, or by hand. */
function inclusionOf(rule: RuleDocument): Record<string, unknown> {
  if (rule.always) return { inclusion: "always" };
  if (rule.globs.length === 0) return { inclusion: "manual" };
  return {
    inclusion: "fileMatch",
    fileMatchPattern: rule.globs.length === 1 ? rule.globs[0] : [...rule.globs],
  };
}
