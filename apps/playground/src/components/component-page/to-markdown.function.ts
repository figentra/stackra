/**
 * Stackra file contract:
 * Purpose: `toMarkdown`, the HeroUI-shaped MDX of a component page (Copy Markdown): frontmatter, Import, Usage and
 *          the examples with their code, Anatomy, Styling (CSS classes) and the API Reference tables per part.
 * Boundary: a pure function over strings and the ApiDoc; the words come in translated, code and prop names never are.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (ViewOptions / Copy Markdown).
 */
import type { ApiProp } from "@stackra/showcase";

import type { MarkdownInput } from "#src/components/component-page/markdown-input.type";

/** A table cell: pipes and newlines would break the row. */
const cell = (value: string | undefined) =>
  (value ?? "")
    .replaceAll("|", "\\|")
    .replaceAll(/\s*\n\s*/g, " ")
    .trim();

const code = (value: string) => `\`${value.replaceAll("`", "\\`")}\``;

/** A GFM table of `rows`; the Default column is left out when `hasDefault` is false. */
function table(rows: readonly ApiProp[], words: MarkdownInput["words"], hasDefault: boolean) {
  const head = [words.prop, words.type, ...(hasDefault ? [words.default] : []), words.description];
  const lines = [
    `| ${head.join(" | ")} |`,
    `|${head.map(() => "---").join("|")}|`,
    ...rows.map((row) =>
      [
        `| ${code(row.name)}${row.required ? "*" : ""}`,
        code(cell(row.type)),
        ...(hasDefault ? [row.default === undefined ? "-" : code(cell(row.default))] : []),
        `${cell(row.description)} |`,
      ].join(" | "),
    ),
  ];
  return lines.join("\n");
}

/** The MDX of a component page. */
export function toMarkdown(input: MarkdownInput): string {
  const { words } = input;
  const out: string[] = [
    "---",
    `title: ${JSON.stringify(input.title)}`,
    `description: ${JSON.stringify(input.description)}`,
    "---",
    "",
    `## ${words.import}`,
    "",
    "```tsx",
    input.importLine,
    "```",
  ];
  for (const [index, example] of input.examples.entries()) {
    out.push("", `### ${index === 0 ? words.usage : example.title}`);
    if (example.code) out.push("", "```tsx", example.code.trimEnd(), "```");
    if (index === 0 && input.anatomy)
      out.push("", `### ${words.anatomy}`, "", "```tsx", input.anatomy, "```");
  }
  if (input.slots?.length) {
    out.push("", `## ${words.styling}`, "");
    for (const slot of input.slots) out.push(`- ${code(slot.name)}: ${cell(slot.description)}`);
  }
  if (input.parts.length) out.push("", `## ${words.api}`);
  for (const part of input.parts) {
    out.push("", `### ${words.propsOf(part.name)}`, "", table(part.props, words, true));
    if (part.renderProps?.length)
      out.push(
        "",
        `### ${part.name} ${words.renderProps}`,
        "",
        table(part.renderProps, words, false),
      );
  }
  return `${out.join("\n")}\n`;
}
