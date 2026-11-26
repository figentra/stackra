/**
 * Stackra file contract:
 * Purpose: `renderConstitution(laws)`: `.flow/constitution.md` from the docs laws, each a `## <title>` section in the
 *          given order with its headings demoted one level. Docs components keep their text and lose their tags: a
 *          `<Step title>` joins into one list item, another component's body is dedented (indented, it would render as
 *          code), and a lone tag line is dropped.
 * Boundary: pure: the laws' names and texts in; the file's text out. Moved from core's agents-sync script (STA-2098
 *           H6), with the same output apart from the generator it names.
 * Runtime: node
 * Governing contract: ADR 0510; STA-2098 (H6).
 */
import { CONSTITUTION_PATHS } from "#node/constants/constitution-paths.constant";

/** `s` without one pair of matching outer quotes. */
const unquote = (s: string): string =>
  (s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))
    ? s.slice(1, -1)
    : s;

/** Each Markdown heading outside fenced code, one level deeper. */
function demoteHeadings(body: string): string {
  let fenced = false;
  return body
    .split("\n")
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
      return !fenced && /^#{1,4} /.test(line) ? `#${line}` : line;
    })
    .join("\n");
}

/** One law's `## <title>` section from its `.mdx` text. */
function lawSection(name: string, raw: string): string {
  const head = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  const title = /^title:\s*(.+)$/m.exec(head?.[1] ?? "")?.[1]?.trim();
  let text = raw.slice(head?.[0].length ?? 0).replace(/^\r?\n/, "");
  text = text.replaceAll(
    /^[ \t]*<Step title="([^"]*)">([\s\S]*?)<\/Step>[ \t]*$/gm,
    (_, stepTitle: string, inner: string) =>
      `- **${stepTitle}**: ${inner
        .trim()
        .split(/\s*\n\s*/)
        .join(" ")}`,
  );
  const block = /^([ \t]*)<([A-Z][A-Za-z]*)\b[^>\n]*>\n([\s\S]*?)\n\1<\/\2>[ \t]*$/gm;
  while (block.test(text))
    text = text.replaceAll(block, (_, _indent: string, _tag: string, inner: string) => {
      const pad = Math.min(
        ...inner
          .split("\n")
          .filter((line) => line.trim())
          .map((line) => /^ */.exec(line)?.[0].length ?? 0),
      );
      return `\n${inner.replaceAll(new RegExp(`^ {0,${pad}}`, "gm"), "")}\n`;
    });
  text = text.replaceAll(/^\s*<\/?[A-Z][A-Za-z]*[^>\n]*>\s*$/gm, "").replaceAll(/\n{3,}/g, "\n\n");
  return `## ${unquote(title ?? name)}\n\n${demoteHeadings(text.trim())}`;
}

/**
 * The constitution's text from its laws, `index.mdx` first and then by name.
 *
 * @param laws - each law's file name and text.
 * @example
 * renderConstitution([{ name: "index.mdx", text: "---\ntitle: Laws\n---\nBody." }]);
 */
export function renderConstitution(
  laws: readonly { readonly name: string; readonly text: string }[],
): string {
  const ordered = laws.toSorted((a, b) =>
    a.name === "index.mdx" ? -1 : b.name === "index.mdx" ? 1 : a.name.localeCompare(b.name),
  );
  return [
    "# Stackra Constitution",
    "",
    `<!-- generated from ${CONSTITUTION_PATHS.source}/*.mdx by stackra constitution — edit the sources, not this file -->`,
    "",
    ...ordered.flatMap((law) => [lawSection(law.name, law.text), ""]),
  ].join("\n");
}
