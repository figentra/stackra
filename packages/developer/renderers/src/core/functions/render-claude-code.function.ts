/**
 * Stackra file contract:
 * Purpose: `renderClaudeCode`, the Claude Code layout of a document set: `skills/<name>/SKILL.md`, `agents/<name>.md`,
 *          `commands/<name>.md`, `rules/<name>.md` (with `paths` for a file-scoped rule) and one `hooks/hooks.json`.
 *          A rule read on request becomes a skill, because Claude Code loads a skill by its description on demand.
 * Boundary: internal; pure. Paths are relative to `.claude/`, `~/.claude/` or a plugin root, which the caller picks;
 *           `hooks/hooks.json` has the shape of the `hooks` key of a Claude Code settings file.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decisions 2, 6 and 9); ADR 0286 (decision 16: Claude Code tested).
 */
import type { AgentDocument, HookDocument } from "@stackra/skills";

import { CLAUDE_HOOK_EVENTS } from "#core/constants/claude-hook-events.constant";
import { composeMarkdown } from "#core/functions/compose-markdown.function";
import { provenanceComment } from "#core/functions/provenance-comment.function";
import type { RenderResult } from "#core/types/render-result.type";
import type { RenderedFile } from "#core/types/rendered-file.type";

/**
 * The Claude Code files; Claude Code takes every kind, so nothing is skipped.
 *
 * @param documents - the documents, in any order.
 * @param generator - who generated the files.
 * @example
 * renderClaudeCode([skill], "stackra agents setup").files[0]?.path; // "skills/naming/SKILL.md"
 */
export function renderClaudeCode(
  documents: readonly AgentDocument[],
  generator: string,
): RenderResult {
  const files: RenderedFile[] = [];
  const hooks: HookDocument[] = [];
  for (const document of documents) {
    const comment = provenanceComment(generator, `${document.kind} "${document.name}"`);
    switch (document.kind) {
      case "skill":
        files.push(skillFile(document.name, document.description, comment, document.body));
        break;
      case "rule":
        if (!document.always && document.globs.length === 0) {
          files.push(skillFile(document.name, document.description, comment, document.body));
        } else {
          const frontMatter = document.always ? undefined : { paths: [...document.globs] };
          files.push({
            path: `rules/${document.name}.md`,
            content: composeMarkdown(frontMatter, comment, document.body),
          });
        }
        break;
      case "subagent":
        files.push({
          path: `agents/${document.name}.md`,
          content: composeMarkdown(
            {
              name: document.name,
              description: document.description,
              tools: document.tools.length > 0 ? document.tools.join(", ") : undefined,
            },
            comment,
            document.body,
          ),
        });
        break;
      case "command":
        files.push({
          path: `commands/${document.name}.md`,
          content: composeMarkdown(
            { description: document.description, "argument-hint": document.argumentHint },
            comment,
            document.body,
          ),
        });
        break;
      case "hook":
        hooks.push(document);
        break;
    }
  }
  if (hooks.length > 0) files.push({ path: "hooks/hooks.json", content: hooksJson(hooks) });
  return { files, skipped: [] };
}

/** A `SKILL.md` with the Agent Skills frontmatter. */
function skillFile(name: string, description: string, comment: string, body: string): RenderedFile {
  return {
    path: `skills/${name}/SKILL.md`,
    content: composeMarkdown({ name, description }, comment, body),
  };
}

/** The hooks, grouped by Claude Code event in `CLAUDE_HOOK_EVENTS` order and by document order within an event. */
function hooksJson(hooks: readonly HookDocument[]): string {
  const byEvent: Record<string, unknown[]> = {};
  for (const [event, claudeEvent] of Object.entries(CLAUDE_HOOK_EVENTS)) {
    const entries = hooks
      .filter((hook) => hook.event === event)
      .map((hook) => ({
        ...(hook.matcher === undefined ? {} : { matcher: hook.matcher }),
        hooks: [{ type: "command", command: hook.run }],
      }));
    if (entries.length > 0) byEvent[claudeEvent] = entries;
  }
  return `${JSON.stringify({ hooks: byEvent }, null, 2)}\n`;
}
