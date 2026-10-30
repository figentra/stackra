/**
 * Stackra file contract:
 * Purpose: `firstTable`, the first GitHub-flavoured markdown table of a section, as HeroRow values.
 * Boundary: a pure function over the lines it is given.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2.
 */
import type { HeroRow } from "./hero-row.type.ts";

/** Splits a GFM table row on unescaped pipes. */
function cells(row: string): string[] {
  return row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replaceAll("\\|", "|"));
}

/** Drops one pair of wrapping backticks: "`'sm' | 'md'`" -> "'sm' | 'md'". */
function unquote(cell: string | undefined): string {
  const text = cell ?? "";
  return /^`[^`]*`$/.test(text) ? text.slice(1, -1) : text;
}

/** The first GFM table in `lines`, as rows keyed by the lower-cased header. */
export function firstTable(lines: readonly string[]): HeroRow[] {
  const start = lines.findIndex((line) => line.trim().startsWith("|"));
  if (start < 0) return [];
  const header = cells(lines[start] ?? "").map((cell) => cell.toLowerCase());
  const col = (...names: string[]) => header.findIndex((cell) => names.includes(cell));
  const name = col("prop", "property", "name", "parameter");
  const type = col("type");
  const fallback = col("default");
  const description = col("description");
  const rows: HeroRow[] = [];
  for (const line of lines.slice(start + 2)) {
    if (!line.trim().startsWith("|")) break;
    const row = cells(line);
    const value = fallback >= 0 ? unquote(row[fallback]) : "";
    rows.push({
      name: unquote(row[name]),
      type: type >= 0 ? unquote(row[type]) : "",
      ...(value && value !== "-" ? { default: value } : {}),
      description: description >= 0 ? (row[description] ?? "") : "",
    });
  }
  return rows.filter((row) => row.name);
}
