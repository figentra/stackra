/**
 * Stackra file contract:
 * Purpose: `renderPackageIndex`, the pure renderer of the customer package index (`src/docs/customers/packages.mdx`,
 *          served at `/customers/packages`): one table per category, one row per published `@stackra` package with
 *          its `stackra.summary`, its `exports` entries (or its command) and links to its README and CHANGELOG on
 *          GitHub, and the package count in the intro. The reader-facing text states no date and no version, so the
 *          page can only be wrong by drifting from the packages, which the drift test catches.
 * Boundary: pure: records in, page text out; reading `package.json` files is `collectPackageIndex`, writing the page
 *           is `writePackageIndex`. Cells are escaped so a summary never breaks the MDX table, and the tables are
 *           padded the way oxfmt pads them, so the generated page passes `format:check` unchanged.
 * Runtime: node
 * Governing contract: ADR 0453 (amendment 2026-10-27: the stackra package fields); ADR 0002 (2026-10-27 amendment:
 *                     scripts outside src/); ADR 0025 (decision 3: ESM entry points); STA-2847.
 */
import type { PackageIndexRecord } from "#scripts/package-index/package-index-record";
import { PACKAGE_INDEX_REPOSITORY } from "#scripts/package-index/package-index-repository";

/** Escapes text for a cell of an MDX table: pipes, MDX expressions, JSX tags and emphasis markers. */
function cell(text: string): string {
  return text
    .replaceAll(/\s+/g, " ")
    .trim()
    .replaceAll("\\", "\\\\")
    .replaceAll("|", "\\|")
    .replaceAll("*", "\\*")
    .replaceAll(/[{}]/g, (brace) => `\\${brace}`)
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/** The width oxfmt measures a cell by (code points; every character in these tables is narrow). */
function width(text: string): number {
  return [...text].length;
}

/** Orders strings by code unit, so `.` comes before `./contracts` as in the package.json files. */
function byCodeUnit(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

/** Renders a table with every column padded to its widest cell, as oxfmt formats a Markdown table. */
function table(header: readonly string[], rows: readonly (readonly string[])[]): string {
  const widths = header.map((title, column) =>
    Math.max(3, width(title), ...rows.map((cells) => width(cells[column] ?? ""))),
  );
  const line = (cells: readonly string[]): string =>
    `| ${cells.map((text, column) => text + " ".repeat((widths[column] ?? 0) - width(text))).join(" | ")} |`;
  return [line(header), line(widths.map((size) => "-".repeat(size))), ...rows.map(line)].join("\n");
}

/** The entry-points cell: the sorted entries, else the command, else "none". */
function entriesCell(record: PackageIndexRecord): string {
  if (record.entries.length > 0)
    return record.entries
      .toSorted(byCodeUnit)
      .map((entry) => `\`${entry}\``)
      .join(", ");
  const commands = (record.commands ?? []).toSorted(byCodeUnit);
  if (commands.length === 0) return "none";
  return `none; the ${commands.map((command) => `\`${command}\``).join(", ")} command`;
}

/** The cells of one package's row. */
function packageRow(record: PackageIndexRecord): string[] {
  const path = `packages/${record.category}/${record.folder}`;
  return [
    `\`${record.name}\``,
    cell(record.summary),
    entriesCell(record),
    `[README](${PACKAGE_INDEX_REPOSITORY}/tree/main/${path}#readme) · [CHANGELOG](${PACKAGE_INDEX_REPOSITORY}/blob/main/${path}/CHANGELOG.md)`,
  ];
}

const FRONTMATTER = `---
title: "API reference"
description: "Every @stackra package: what it is for, its entry points, and links to its README and changelog."
icon: "library"
---`;

const CONTRACT =
  "{/* Stackra file contract: Purpose: the package index buyers use as the API reference until a generated TSDoc reference exists: one row per published @stackra package with its summary (package.json stackra.summary), its export entries and links to its README and CHANGELOG. Boundary: generated from packages/<category>/<name>/package.json by apps/docs/scripts/package-index/write-package-index.ts; never edit it by hand, run the writer; the docs test fails when this page differs from what the writer produces. Runtime: docs. Governing contract: ADR 0453 (amendment 2026-10-27: the stackra package fields); ADR 0025 (decision 3); ADR 0039; STA-1575; STA-2847. */}";

const NOTE = `<Note>
  A reference generated from the TSDoc comments is planned. The docs app cannot generate one today
  without adding a dependency (TypeDoc or API Extractor), so this index is the reference until then.
  HTTP API references for services are generated from their manifests and appear in their own tab
  when a service is published. \`@stackra-pro\` packages are documented in their own READMEs,
  delivered inside each tarball.
</Note>`;

/**
 * Renders the package index page from the published packages, grouped by category (alphabetical) and sorted by name.
 *
 * @param records - every published `@stackra` package; order does not matter.
 * @returns the page text, ending with one newline.
 * @example
 * renderPackageIndex([{ name: "@stackra/money", category: "commerce", folder: "money", summary: "…", entries: ["."] }]);
 */
export function renderPackageIndex(records: readonly PackageIndexRecord[]): string {
  const byCategory = new Map<string, PackageIndexRecord[]>();
  for (const record of records) {
    const list = byCategory.get(record.category) ?? [];
    list.push(record);
    byCategory.set(record.category, list);
  }
  const sections = [...byCategory.keys()]
    .toSorted((a, b) => a.localeCompare(b, "en"))
    .map((category) => {
      const rows = (byCategory.get(category) ?? [])
        .toSorted((a, b) => a.name.localeCompare(b.name, "en"))
        .map(packageRow);
      return `## \`${category}\`\n\n${table(["Package", "Use it for", "Entry points", "Source"], rows)}`;
    });
  const intro =
    records.length === 0
      ? "No `@stackra` package is published yet."
      : `Each package's README is its reference: what it exports, how to configure it, and examples. The table lists every
published \`@stackra\` package (${records.length}) by category, with its entry points (\`import … from "@stackra/<name>/<entry>"\`).
Every package releases at the same version; the [changelog](/customers/changelog) says how to see the current one.`;
  return `${[FRONTMATTER, CONTRACT, intro, NOTE, ...sections].join("\n\n")}\n`;
}
