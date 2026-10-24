/**
 * Stackra file contract:
 * Purpose: `loadSkillSet(root?)`, every agent document under a skill set root, read from disk and parsed: by default
 *          the open Stackra conventions this package ships in `assets/`, which the renderers and `stackra agents setup`
 *          write into each assistant's layout.
 * Boundary: reads files only; never writes. Kinds come in `AgentDocumentKind` order and names sorted within a kind, so
 *           the output is stable. A missing kind folder means none of that kind; a folder's `README.md` is skipped.
 * Runtime: node
 * Governing contract: ADR 0282 (decisions 2, 6 and 10); ADR 0286 (decision 6: the renderers read this package).
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { Enum } from "@stackra/contracts";

import { AgentDocumentKind } from "#core/enums/agent-document-kind.enum";
import { AgentDocumentInvalidError } from "#core/errors/agent-document-invalid.error";
import { parseAgentDocument } from "#core/functions/parse-agent-document.function";
import type { AgentDocument } from "#core/types/agent-document.type";
import { KIND_FOLDERS } from "#node/constants/kind-folders.constant";
import { bundledRoot } from "#node/functions/bundled-root.function";

/**
 * The parsed documents under `root`.
 *
 * @param root - a folder holding `skills/`, `rules/`, `subagents/`, `commands/` and `hooks/`, any of which may be
 *               missing; defaults to this package's `assets/`.
 * @throws AgentDocumentInvalidError when `root` is not a folder, a skill folder has no `SKILL.md`, or a document fails
 *         `parseAgentDocument`.
 * @example
 * const documents = loadSkillSet();
 * documents.filter((document) => document.kind === "rule" && document.always).map((rule) => rule.name);
 */
export function loadSkillSet(root: string = bundledRoot()): readonly AgentDocument[] {
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    throw new AgentDocumentInvalidError(root, [{ path: "", message: "Not a folder" }]);
  }
  const documents: AgentDocument[] = [];
  for (const kind of Enum.values(AgentDocumentKind)) {
    const folder = join(root, KIND_FOLDERS[kind]);
    if (!existsSync(folder)) continue;
    const entries = readdirSync(folder, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name, "en"),
    );
    for (const entry of entries) {
      let file: string;
      if (kind === "skill") {
        if (!entry.isDirectory()) continue;
        file = join(folder, entry.name, "SKILL.md");
        if (!existsSync(file)) {
          throw new AgentDocumentInvalidError(file, [
            { path: "", message: "A skill folder must hold a SKILL.md" },
          ]);
        }
      } else {
        if (!entry.isFile() || !entry.name.endsWith(".md") || entry.name === "README.md") continue;
        file = join(folder, entry.name);
      }
      documents.push(parseAgentDocument(kind, readFileSync(file, "utf8"), file));
    }
  }
  return Object.freeze(documents);
}
