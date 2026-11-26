/**
 * Stackra file contract:
 * Purpose: `checkThreatModel(path, text)`, the shape of one member's threat model (constitution SEC10, "Threat model
 *          template"): an `ASVS level:` line and a `Reviewed:` date, then `## Assets` (asset, where it lives, class),
 *          `## Trust boundaries` (a numbered list) and `## Threats and controls` (threat, control today, open work),
 *          in that order, each with at least one entry. A class is one of the four the constitution names, and a
 *          threat whose control today is "None" names the issue that tracks it, so a gap is a backlog item.
 * Boundary: pure; `text` is the file, undefined when it is missing. Judges the shape, never whether a threat is real.
 * Runtime: node
 * Governing contract: constitution SEC4 (the four classes) and SEC10; ADR 0207 (amendment of 2026-11-26: the ASVS
 *                     level); STA-316.
 */

/** The data classes an asset may carry (constitution SEC4, plus `secret` for credentials and keys). */
const CLASSES = ["internal", "confidential", "pii", "secret"];

/** The three sections, in order, with the header row each table must carry (the boundaries are a list). */
const SECTIONS = [
  { heading: "Assets", columns: ["Asset", "Where it lives", "Class"] },
  { heading: "Trust boundaries", columns: undefined },
  { heading: "Threats and controls", columns: ["Threat", "Control today", "Open work"] },
] as const;

/** The declared ASVS level, L1 to L3, at the start of a line. */
const ASVS_LINE = /^ASVS level: L[123]\b/m;

/** The review date, at the start of a line. */
const REVIEWED_LINE = /^Reviewed: \d{4}-\d{2}-\d{2}\b/m;

/** An issue key such as `STA-316`. */
const ISSUE_KEY = /\b[A-Z][A-Z0-9]*-\d+\b/;

/** A numbered list item. */
const NUMBERED_ITEM = /^\d+\.\s+\S/;

/** A markdown table's separator row. */
const SEPARATOR_ROW = /^\|(?:\s*:?-+:?\s*\|)+\s*$/;

/** One line of the file with its 1-based number. */
type Line = { readonly n: number; readonly text: string };

/** The cells of a table row, split on unescaped pipes and trimmed. */
function cellsOf(row: string): string[] {
  return row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim());
}

/** A cell's text without backticks, emphasis and surrounding space. */
const plain = (cell: string): string => cell.replaceAll(/[`*_]/g, "").trim();

/** The table rows (after the header and separator) of `lines`, or the problem with its header. */
function tableOf(
  lines: readonly Line[],
  columns: readonly string[],
):
  | { readonly rows: { readonly n: number; readonly cells: string[] }[] }
  | { readonly problem: string } {
  const table = lines.filter((line) => line.text.trim().startsWith("|"));
  const [header, separator, ...body] = table;
  if (!header) return { problem: "has no table" };
  const names = cellsOf(header.text).map(plain);
  if (names.join("|") !== columns.join("|") || !separator || !SEPARATOR_ROW.test(separator.text))
    return { problem: `table header must be | ${columns.join(" | ")} |` };
  return { rows: body.map((line) => ({ n: line.n, cells: cellsOf(line.text) })) };
}

/**
 * The threat-model findings of one member.
 *
 * @param path - the file's repository-relative path, printed in every finding.
 * @param text - the file, or undefined when the member has none.
 * @example
 * checkThreatModel("packages/security/iam/docs/threat-model.md", undefined);
 * // ["packages/security/iam/docs/threat-model.md: missing; …"]
 */
export function checkThreatModel(path: string, text: string | undefined): string[] {
  if (text === undefined)
    return [
      `${path}: missing; a security-relevant member keeps a threat model (constitution SEC10)`,
    ];
  const out: string[] = [];
  if (!ASVS_LINE.test(text))
    out.push(`${path}: no "ASVS level: L1|L2|L3" line (ADR 0207, amendment of 2026-11-26)`);
  if (!REVIEWED_LINE.test(text))
    out.push(`${path}: no "Reviewed: YYYY-MM-DD" line (constitution SEC10)`);

  const lines: Line[] = text.split("\n").map((line, index) => ({ n: index + 1, text: line }));
  const headings = lines.filter((line) => line.text.startsWith("## "));
  let previous = -1;
  for (const section of SECTIONS) {
    const at = headings.findIndex((h) => h.text.trim() === `## ${section.heading}`);
    if (at === -1) {
      out.push(`${path}: no "## ${section.heading}" section (constitution SEC10)`);
      continue;
    }
    if (at < previous)
      out.push(
        `${path}:${headings[at]?.n}: "## ${section.heading}" is out of order; the sections are ${SECTIONS.map((s) => s.heading).join(", ")}`,
      );
    previous = at;
    const start = headings[at]?.n ?? 0;
    const end = headings[at + 1]?.n ?? lines.length + 1;
    const body = lines.slice(start, end - 1);
    if (section.columns === undefined) {
      if (!body.some((line) => NUMBERED_ITEM.test(line.text)))
        out.push(`${path}:${start}: "## ${section.heading}" has no numbered boundary`);
      continue;
    }
    const table = tableOf(body, section.columns);
    if ("problem" in table) {
      out.push(`${path}:${start}: "## ${section.heading}" ${table.problem}`);
      continue;
    }
    if (table.rows.length === 0) out.push(`${path}:${start}: "## ${section.heading}" has no row`);
    for (const row of table.rows) {
      if (row.cells.length !== section.columns.length) {
        out.push(
          `${path}:${row.n}: the row has ${row.cells.length} cells, not ${section.columns.length}`,
        );
        continue;
      }
      if (row.cells.some((cell) => plain(cell) === ""))
        out.push(`${path}:${row.n}: an empty cell; write "—" where there is nothing`);
      if (section.heading === "Assets") {
        const cls = plain(row.cells[2] ?? "");
        if (!CLASSES.includes(cls))
          out.push(
            `${path}:${row.n}: class "${cls}" is not one of ${CLASSES.join(", ")} (constitution SEC4)`,
          );
      } else if (/^none\b/i.test(plain(row.cells[1] ?? "")) && !ISSUE_KEY.test(row.cells[2] ?? ""))
        out.push(
          `${path}:${row.n}: a threat with no control today names the issue that tracks it in "Open work" (constitution SEC10)`,
        );
    }
  }
  return out;
}
