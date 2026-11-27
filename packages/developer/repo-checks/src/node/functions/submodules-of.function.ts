/**
 * Stackra file contract:
 * Purpose: `submodulesOf(text)`, the submodules a `.gitmodules` text declares, read in git's config syntax: one
 *          `[submodule "<name>"]` section each, with its `path` and `url` keys; comments and other sections are skipped.
 * Boundary: pure; `layoutFindings` reads the file.
 * Runtime: node
 * Governing contract: ADR 0526 (decision 4).
 */
import type { Submodule } from "#node/types/submodule.type";

/** A section header: `[submodule "name"]` (any other section is not a submodule). */
const SECTION = /^\[\s*([A-Za-z][\w.-]*)(?:\s+"((?:[^"\\]|\\.)*)")?\s*\]$/;

/** A `key = value` line, the value up to an unquoted comment. */
const ENTRY = /^([A-Za-z][\w-]*)\s*=\s*(.*)$/;

/** A value without its trailing comment and surrounding quotes. */
function valueOf(raw: string): string {
  const bare = raw.replace(/\s+[#;].*$/, "").trim();
  return bare.length >= 2 && bare.startsWith('"') && bare.endsWith('"') ? bare.slice(1, -1) : bare;
}

/**
 * The submodules of a `.gitmodules` text, in file order.
 *
 * @param text - the `.gitmodules` file.
 * @example
 * submodulesOf('[submodule "docs"]\n\tpath = docs\n\turl = https://example.com/docs.git\n');
 * // [{ name: "docs", path: "docs", url: "https://example.com/docs.git" }]
 */
export function submodulesOf(text: string): Submodule[] {
  const out: { name: string; path?: string; url?: string }[] = [];
  let current: { name: string; path?: string; url?: string } | undefined;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === "" || line.startsWith("#") || line.startsWith(";")) continue;
    const section = SECTION.exec(line);
    if (section) {
      current =
        section[1]?.toLowerCase() === "submodule" && section[2] !== undefined
          ? { name: section[2] }
          : undefined;
      if (current) out.push(current);
      continue;
    }
    const entry = ENTRY.exec(line);
    if (!current || !entry) continue;
    const key = entry[1]?.toLowerCase();
    if (key === "path") current.path = valueOf(entry[2] ?? "");
    else if (key === "url") current.url = valueOf(entry[2] ?? "");
  }
  return out.map((s) => ({ name: s.name, path: s.path ?? s.name, url: s.url ?? "" }));
}
