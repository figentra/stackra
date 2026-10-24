/**
 * Stackra file contract:
 * Purpose: `splitFrontMatter`, a Markdown document split into its YAML frontmatter (parsed, duplicate keys refused)
 *          and the body after it. The frontmatter must open the document with a `---` line and close with another.
 * Boundary: internal; `parseAgentDocument` checks the parsed mapping against the kind's schema.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decision 2: Markdown with frontmatter).
 */
import { parse } from "yaml";

import { AgentDocumentInvalidError } from "#core/errors/agent-document-invalid.error";

const FENCE = /^---[ \t]*$/;

/**
 * The frontmatter mapping and the body of `text`.
 *
 * @param text - the whole document.
 * @param source - the file path, for the error.
 * @throws AgentDocumentInvalidError when the document has no closed frontmatter, the YAML does not parse, or it is not
 *         a mapping.
 * @example
 * splitFrontMatter("---\ndescription: Name things\n---\n\n# Naming\n", "skills/naming/SKILL.md");
 * // { data: { description: "Name things" }, body: "# Naming\n" }
 */
export function splitFrontMatter(
  text: string,
  source: string,
): { data: Record<string, unknown>; body: string } {
  const lines = (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text).split(/\r?\n/);
  const end = FENCE.test(lines[0] ?? "")
    ? lines.findIndex((line, index) => index > 0 && FENCE.test(line))
    : -1;
  if (end === -1) {
    throw new AgentDocumentInvalidError(source, [
      { path: "", message: "Must open with a frontmatter block between two `---` lines" },
    ]);
  }
  let data: unknown;
  try {
    data = parse(lines.slice(1, end).join("\n"));
  } catch (error) {
    throw new AgentDocumentInvalidError(source, [
      { path: "", message: `Frontmatter is not YAML: ${(error as Error).message}` },
    ]);
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new AgentDocumentInvalidError(source, [
      { path: "", message: "Frontmatter must be a mapping" },
    ]);
  }
  return {
    data: data as Record<string, unknown>,
    body: lines
      .slice(end + 1)
      .join("\n")
      .replace(/^\n+/, ""),
  };
}
