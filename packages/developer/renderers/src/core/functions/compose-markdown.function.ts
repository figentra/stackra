/**
 * Stackra file contract:
 * Purpose: `composeMarkdown`, one rendered Markdown file: an optional frontmatter block, the provenance comment, then
 *          the body, ending in one newline. A frontmatter mapping is written as YAML without line folding; a string is
 *          taken as the YAML lines already written (Cursor's own `globs` form is not strict YAML).
 * Boundary: internal; pure, the same input gives the same bytes.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decision 2: Markdown with frontmatter).
 */
import { stringify } from "yaml";

/**
 * The file text.
 *
 * @param frontMatter - a mapping (keys whose value is `undefined` are left out), YAML lines, or `undefined` for none.
 * @param comment - the provenance comment.
 * @param body - the Markdown body; leading blank lines and trailing whitespace are trimmed.
 * @example
 * composeMarkdown({ name: "naming", description: "Name things" }, "<!-- generated -->", "# Naming\n");
 * // "---\nname: naming\ndescription: Name things\n---\n\n<!-- generated -->\n\n# Naming\n"
 */
export function composeMarkdown(
  frontMatter: Readonly<Record<string, unknown>> | string | undefined,
  comment: string,
  body: string,
): string {
  const yaml =
    typeof frontMatter === "string"
      ? frontMatter
      : frontMatter && stringify(frontMatter, { lineWidth: 0 });
  const head = yaml === undefined ? "" : `---\n${yaml.endsWith("\n") ? yaml : `${yaml}\n`}---\n\n`;
  return `${head}${comment}\n\n${body.replace(/^(?:[ \t]*\r?\n)+/, "").trimEnd()}\n`;
}
