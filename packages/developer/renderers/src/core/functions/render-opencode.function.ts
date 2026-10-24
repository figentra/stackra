/**
 * Stackra file contract:
 * Purpose: `renderOpenCode`, the OpenCode layout of a document set: `skills/<name>/SKILL.md`, `agents/<name>.md` and
 *          `commands/<name>.md`. A rule read on request becomes a skill. OpenCode has no tool grant, so a sub-agent's
 *          tools become denies of every action they do not reach.
 * Boundary: internal; pure. Paths are relative to `.opencode/` or `~/.config/opencode/`. Always-on and file-scoped
 *           rules are skipped (OpenCode reads them from `AGENTS.md`), and so are hooks (OpenCode hooks are code
 *           plugins). A command's argument hint is dropped: OpenCode has no field for it.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decision 2); ADR 0286 (decisions 6 and 16: ported from Vellum, OpenCode tested).
 */
import type { AgentDocument } from "@stackra/skills";

import { OPENCODE_ACTIONS } from "#core/constants/opencode-actions.constant";
import { composeMarkdown } from "#core/functions/compose-markdown.function";
import { provenanceComment } from "#core/functions/provenance-comment.function";
import type { RenderResult } from "#core/types/render-result.type";
import type { RenderedFile } from "#core/types/rendered-file.type";
import type { SkippedDocument } from "#core/types/skipped-document.type";

/**
 * The OpenCode files and the documents OpenCode has no file for.
 *
 * @param documents - the documents, in any order.
 * @param generator - who generated the files.
 * @example
 * renderOpenCode([subagent], "stackra agents setup").files[0]?.path; // "agents/reviewer.md"
 */
export function renderOpenCode(
  documents: readonly AgentDocument[],
  generator: string,
): RenderResult {
  const files: RenderedFile[] = [];
  const skipped: SkippedDocument[] = [];
  for (const document of documents) {
    const comment = provenanceComment(generator, `${document.kind} "${document.name}"`);
    switch (document.kind) {
      case "rule":
        if (document.always || document.globs.length > 0) {
          skipped.push({
            kind: document.kind,
            name: document.name,
            reason:
              "OpenCode reads always-on and file-scoped rules from AGENTS.md; render agents_md for them",
          });
          break;
        }
        files.push(skillFile(document.name, document.description, comment, document.body));
        break;
      case "skill":
        files.push(skillFile(document.name, document.description, comment, document.body));
        break;
      case "subagent":
        files.push({
          path: `agents/${document.name}.md`,
          content: composeMarkdown(
            {
              description: document.description,
              mode: "subagent",
              permissions: document.tools.length > 0 ? permissionsFor(document.tools) : undefined,
            },
            comment,
            document.body,
          ),
        });
        break;
      case "command":
        files.push({
          path: `commands/${document.name}.md`,
          content: composeMarkdown({ description: document.description }, comment, document.body),
        });
        break;
      case "hook":
        skipped.push({
          kind: document.kind,
          name: document.name,
          reason: "OpenCode hooks are plugins written in code; it has no hook file",
        });
        break;
    }
  }
  return { files, skipped };
}

/** A `SKILL.md` with the Agent Skills frontmatter. */
function skillFile(name: string, description: string, comment: string, body: string): RenderedFile {
  return {
    path: `skills/${name}/SKILL.md`,
    content: composeMarkdown({ name, description }, comment, body),
  };
}

/** A deny for every OpenCode action the tools do not reach, or one allow-all rule when they reach every action. */
function permissionsFor(
  tools: readonly string[],
): { action: string; resource: string; effect: string }[] {
  const granted = new Set(tools.map((tool) => OPENCODE_ACTIONS[tool]));
  const denied = [...new Set(Object.values(OPENCODE_ACTIONS))].filter(
    (action) => !granted.has(action),
  );
  return denied.length > 0
    ? denied.map((action) => ({ action, resource: "*", effect: "deny" }))
    : [{ action: "*", resource: "*", effect: "allow" }];
}
