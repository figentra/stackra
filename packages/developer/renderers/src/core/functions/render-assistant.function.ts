/**
 * Stackra file contract:
 * Purpose: `renderAssistant`, the one public renderer: a set of neutral agent documents (as `@stackra/skills` parses
 *          them) written into one assistant's layout. The files come sorted by path, so the same documents always give
 *          the same output, and two documents that would write one path are refused.
 * Boundary: pure; reads and writes nothing. Paths are relative to the assistant's root, which the caller picks: user
 *           level for `stackra agents setup`, the project for `sync` (ADR 0282 decision 10), or Vellum's own.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decisions 2, 3 and 10); ADR 0286 (decision 6: the renderer layer is Stackra's).
 */
import type { AgentDocument } from "@stackra/skills";

import { Assistant } from "#core/enums/assistant.enum";
import { RenderInputError } from "#core/errors/render-input.error";
import { renderAgentsMd } from "#core/functions/render-agents-md.function";
import { renderClaudeCode } from "#core/functions/render-claude-code.function";
import { renderCursor } from "#core/functions/render-cursor.function";
import { renderKiro } from "#core/functions/render-kiro.function";
import { renderOpenCode } from "#core/functions/render-opencode.function";
import type { RenderOptions } from "#core/types/render-options.type";
import type { RenderResult } from "#core/types/render-result.type";

const RENDERERS: Readonly<
  Record<Assistant, (documents: readonly AgentDocument[], generator: string) => RenderResult>
> = {
  [Assistant.ClaudeCode]: renderClaudeCode,
  [Assistant.OpenCode]: renderOpenCode,
  [Assistant.Kiro]: renderKiro,
  [Assistant.Cursor]: renderCursor,
  [Assistant.AgentsMd]: renderAgentsMd,
};

/**
 * The assistant's files and the documents it has no form for.
 *
 * @param assistant - the layout to write.
 * @param documents - the documents, for example `loadSkillSet()` from `@stackra/skills/node`.
 * @param options - the generator name for the provenance comments.
 * @throws RenderInputError when the assistant is unknown, two documents would write one path, or (Kiro) a sub-agent
 *         names a tool with no mapping.
 * @example
 * const { files, skipped } = renderAssistant(Assistant.ClaudeCode, loadSkillSet(), { generator: "stackra agents setup" });
 * files.map((file) => file.path); // ["agents/reviewer.md", "rules/versions.md", "skills/naming/SKILL.md", …]
 */
export function renderAssistant(
  assistant: Assistant,
  documents: readonly AgentDocument[],
  options: RenderOptions = {},
): RenderResult {
  const render = Object.hasOwn(RENDERERS, assistant) ? RENDERERS[assistant] : undefined;
  if (render === undefined) throw new RenderInputError(String(assistant), "unknown assistant");
  const rendered = render(documents, options.generator ?? "@stackra/renderers");
  const files = [...rendered.files].sort((a, b) =>
    a.path < b.path ? -1 : a.path > b.path ? 1 : 0,
  );
  const duplicate = files.find((file, index) => index > 0 && files[index - 1]?.path === file.path);
  if (duplicate !== undefined) {
    throw new RenderInputError(
      assistant,
      `two documents write "${duplicate.path}"; rename one of them`,
    );
  }
  return { files: Object.freeze(files), skipped: Object.freeze([...rendered.skipped]) };
}
