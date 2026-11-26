/**
 * Stackra file contract:
 * Purpose: `descriptionOf(text)`, the `description` of a docs page's frontmatter, without surrounding quotes; an ADR
 *          page states its status there ("Accepted · 2026-10-28").
 * Boundary: pure; reads only the frontmatter block at the top of the page.
 * Runtime: node
 * Governing contract: ADR template (apps/docs/src/docs/adr/template.mdx); STA-2851.
 */

/** The frontmatter block at the top of a page. */
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;

/** The description line of a frontmatter block. */
const DESCRIPTION = /^description:\s*(.*)$/m;

/**
 * The page's frontmatter description, or undefined when it has none.
 *
 * @param text - the page.
 * @example
 * descriptionOf('---\ntitle: "0001 — A"\ndescription: "Accepted · 2026-10-19"\n---\n'); // "Accepted · 2026-10-19"
 */
export function descriptionOf(text: string): string | undefined {
  const frontmatter = FRONTMATTER.exec(text)?.[1];
  const value = frontmatter === undefined ? undefined : DESCRIPTION.exec(frontmatter)?.[1]?.trim();
  return value?.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
}
