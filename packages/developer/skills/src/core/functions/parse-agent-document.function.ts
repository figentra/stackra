/**
 * Stackra file contract:
 * Purpose: `parseAgentDocument(kind, text, source)`, the one reader of the neutral format: a Markdown document with
 *          frontmatter checked against its kind's strict schema, its name derived from its path, returned typed for its
 *          kind with defaults applied.
 * Boundary: text in, a parsed document out; reading files is `loadSkillSet`'s (`./node`), writing each assistant's
 *           layout is the renderers'. A frontmatter `name`, when present, must equal the derived name.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decision 2); ADR 0294 (decision 20).
 */
import type { z } from "zod";

import { FRONT_MATTER_SCHEMAS } from "#core/constants/front-matter-schemas.constant";
import type { AgentDocumentKind } from "#core/enums/agent-document-kind.enum";
import { AgentDocumentInvalidError } from "#core/errors/agent-document-invalid.error";
import { documentName } from "#core/functions/document-name.function";
import { splitFrontMatter } from "#core/functions/split-front-matter.function";
import type { AgentDocument } from "#core/types/agent-document.type";

/**
 * The parsed document of `kind`.
 *
 * @param kind - which kind of document `text` is.
 * @param text - the whole Markdown file.
 * @param source - its file path; the name is derived from it (`skills/<name>/SKILL.md`, `rules/<name>.md`).
 * @throws AgentDocumentInvalidError naming every invalid path: no frontmatter, a missing or empty required key, an
 *         unknown key, a name that is not kebab-case or differs from the path, a hook event no assistant has.
 * @example
 * const rule = parseAgentDocument("rule", text, "rules/naming-and-casing.md");
 * rule.always; // true
 */
export function parseAgentDocument<K extends AgentDocumentKind>(
  kind: K,
  text: string,
  source: string,
): Extract<AgentDocument, { kind: K }> {
  const derived = documentName(kind, source);
  if (derived.issue) throw new AgentDocumentInvalidError(source, [derived.issue]);

  const { data, body } = splitFrontMatter(text, source);
  const schema: z.ZodType<{ name?: string | undefined }> = FRONT_MATTER_SCHEMAS[kind];
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AgentDocumentInvalidError(
      source,
      result.error.issues.map((issue) => ({
        path: issue.path.map(String).join("."),
        message: issue.message,
      })),
    );
  }
  const { name, ...fields } = result.data;
  if (name !== undefined && name !== derived.name) {
    throw new AgentDocumentInvalidError(source, [
      {
        path: "name",
        message: `"${name}" differs from the name its path gives, "${derived.name}"`,
      },
    ]);
  }
  const document = Object.freeze({ kind, name: derived.name, ...fields, body, source });
  // the schema of `kind` produced `fields`, so the document has that kind's shape; TS cannot follow the generic index
  return document as unknown as Extract<AgentDocument, { kind: K }>;
}
