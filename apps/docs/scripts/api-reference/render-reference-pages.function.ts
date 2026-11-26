/**
 * Stackra file contract:
 * Purpose: `renderReferencePages(pkg)`, one package's API reference: the package facts, then per entry point every
 *          exported symbol with its kind, declaring file, declaration, TSDoc (summary, remarks, parameters, returns,
 *          throws, deprecation, examples) and a member table; names re-exported from other packages are listed per
 *          package. A package with more than `SPLIT_AT` exported names gets one page per entry point besides `.`, so
 *          no page grows past what a browser loads comfortably (@stackra/ui's single page was 12.6 MB of HTML).
 * Boundary: pure over an `ApiPackage`; the same input always renders the same bytes (the drift check relies on it).
 * Runtime: node
 * Governing contract: ADR 0007 (docblock standard); ADR 0514 (Fumadocs MDX pages); STA-2857.
 */
import type { ApiDoc } from "#scripts/api-reference/api-doc.type";
import type { ApiEntry } from "#scripts/api-reference/api-entry.type";
import type { ApiMember } from "#scripts/api-reference/api-member.type";
import type { ApiPackage } from "#scripts/api-reference/api-package.type";
import type { ApiSymbolKind } from "#scripts/api-reference/api-symbol-kind.type";
import type { ApiSymbol } from "#scripts/api-reference/api-symbol.type";
import { cell } from "#scripts/api-reference/cell.function";
import { codeBlock } from "#scripts/api-reference/code-block.function";
import { inlineCode } from "#scripts/api-reference/inline-code.function";
import { prose } from "#scripts/api-reference/prose.function";
import type { ReferencePage } from "#scripts/api-reference/reference-page.type";
import { referencePath } from "#scripts/api-reference/reference-path.function";
import { REGENERATE_COMMAND } from "#scripts/api-reference/regenerate-command.constant";
import { SPLIT_AT } from "#scripts/api-reference/split-at.constant";

/** The heading word of each kind. */
const KIND_LABEL: Readonly<Record<ApiSymbolKind, string>> = {
  class: "Class",
  function: "Function",
  interface: "Interface",
  type: "Type",
  variable: "Constant",
  enum: "Enum",
  namespace: "Namespace",
  reexport: "Re-export",
};

/** The import path of an entry (`@stackra/money/contracts`). */
function importPath(pkg: ApiPackage, entry: ApiEntry): string {
  return entry.subpath === "." ? pkg.name : `${pkg.name}/${entry.subpath.replace(/^\.\//, "")}`;
}

/** A member's description cell: its summary, its parameters and returns, and a deprecation mark. */
function memberCell(doc: ApiDoc): string {
  const parts: string[] = [];
  if (doc.deprecated !== undefined) parts.push(`**Deprecated.** ${prose(doc.deprecated)}`.trim());
  if (doc.summary !== "") parts.push(prose(doc.summary));
  for (const param of doc.params) {
    if (param.text !== "") parts.push(`${inlineCode(param.name)}: ${prose(param.text)}`);
  }
  if (doc.returns !== undefined && doc.returns !== "") parts.push(`Returns ${prose(doc.returns)}`);
  for (const thrown of doc.throws) parts.push(`Throws ${prose(thrown)}`);
  return cell(parts.join(" · ")) || "—";
}

/** The member table of a symbol, or nothing when it has no members. */
function memberTable(members: readonly ApiMember[]): string[] {
  if (members.length === 0) return [];
  const rows = members.map(
    (member) => `| ${cell(inlineCode(member.signature))} | ${memberCell(member.doc)} |`,
  );
  return ["| Member | Description |", "| ------ | ----------- |", ...rows, ""];
}

/** The TSDoc blocks of a symbol after its declaration. */
function docBlocks(doc: ApiDoc): string[] {
  const lines: string[] = [];
  if (doc.deprecated !== undefined)
    lines.push(`**Deprecated.** ${prose(doc.deprecated)}`.trim(), "");
  if (doc.summary !== "") lines.push(prose(doc.summary), "");
  if (doc.remarks !== undefined && doc.remarks !== "") lines.push(prose(doc.remarks), "");
  const named = [
    ...doc.typeParams.map((param) => ({ ...param, label: "Type parameter" })),
    ...doc.params.map((param) => ({ ...param, label: "Parameter" })),
  ];
  if (named.length > 0) {
    lines.push("| Parameter | Description |", "| --------- | ----------- |");
    for (const param of named) {
      const text = param.text === "" ? "—" : cell(prose(param.text));
      lines.push(
        `| ${cell(inlineCode(param.name))}${param.label === "Type parameter" ? " (type)" : ""} | ${text} |`,
      );
    }
    lines.push("");
  }
  if (doc.returns !== undefined && doc.returns !== "")
    lines.push(`**Returns** ${prose(doc.returns)}`, "");
  if (doc.yields !== undefined && doc.yields !== "")
    lines.push(`**Yields** ${prose(doc.yields)}`, "");
  if (doc.defaultValue !== undefined && doc.defaultValue !== "") {
    lines.push(`**Default** ${prose(doc.defaultValue)}`, "");
  }
  for (const thrown of doc.throws) lines.push(`**Throws** ${prose(thrown)}`, "");
  for (const see of doc.see) lines.push(`**See** ${prose(see)}`, "");
  for (const example of doc.examples) {
    lines.push(
      "**Example**",
      "",
      /^\s*(`{3,}|~{3,})/m.test(example) ? prose(example) : codeBlock(example, "ts"),
      "",
    );
  }
  return lines;
}

/** One symbol's section. */
function symbolSection(symbol: ApiSymbol): string[] {
  return [
    `### ${inlineCode(symbol.name)}`,
    "",
    `${KIND_LABEL[symbol.kind]} · declared in ${inlineCode(symbol.file)}`,
    "",
    codeBlock(symbol.signature, "ts"),
    "",
    ...docBlocks(symbol.doc),
    ...memberTable(symbol.members),
  ];
}

/** The names an entry passes on from other packages, one line per package. */
function reexportLines(symbols: readonly ApiSymbol[]): string[] {
  const byPackage = new Map<string, string[]>();
  for (const symbol of symbols) {
    const from = symbol.from ?? "";
    byPackage.set(from, [...(byPackage.get(from) ?? []), symbol.name]);
  }
  const lines: string[] = [];
  for (const from of [...byPackage.keys()].toSorted()) {
    const names = byPackage.get(from) ?? [];
    const source = from.startsWith("@stackra/")
      ? `[${inlineCode(from)}](/${referencePath(from)})`
      : inlineCode(from);
    lines.push(
      `Re-exported from ${source} (${names.length}): ${names.map((name) => inlineCode(name)).join(", ")}.`,
      "",
    );
  }
  return lines;
}

/** One entry point's section. */
function entrySection(pkg: ApiPackage, entry: ApiEntry): string[] {
  const lines = [`## ${inlineCode(importPath(pkg, entry))}`, ""];
  if (entry.kind === "file") {
    lines.push(
      `A file entry: ${inlineCode(entry.subpath)} maps to ${inlineCode(entry.target)} in the package. It has no TypeScript API.`,
      "",
    );
    return lines;
  }
  const own = entry.symbols.filter((symbol) => symbol.kind !== "reexport");
  const passed = entry.symbols.filter((symbol) => symbol.kind === "reexport");
  if (own.length === 0 && passed.length === 0) {
    lines.push(`${inlineCode(entry.target)} exports no names.`, "");
    return lines;
  }
  lines.push(
    `From ${inlineCode(entry.target)}: ${own.length} exported ${own.length === 1 ? "name" : "names"}` +
      (passed.length > 0 ? ` and ${passed.length} re-exported from other packages.` : "."),
    "",
  );
  if (own.length > 0) {
    lines.push(
      "| Name | Kind | Summary |",
      "| ---- | ---- | ------- |",
      ...own.map(
        (symbol) =>
          `| ${cell(inlineCode(symbol.name))} | ${KIND_LABEL[symbol.kind]} | ${cell(prose(symbol.doc.summary.split(/\n\s*\n/)[0] ?? "")) || "—"} |`,
      ),
      "",
    );
  }
  lines.push(...reexportLines(passed));
  for (const symbol of own) lines.push(...symbolSection(symbol));
  return lines;
}

/** The front matter and the generated-file comment of a page. */
function head(title: string, description: string, pkg: ApiPackage): string[] {
  return [
    "---",
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(description)}`,
    "---",
    "",
    `{/* Generated by apps/docs/scripts/api-reference from ${pkg.dir} (package.json and the TSDoc of its entry files): never edit; run \`${REGENERATE_COMMAND}\`. pnpm validate fails when this page differs from what the script writes. STA-2857. */}`,
    "",
  ];
}

/** The page text: lines joined, ending with one newline. */
function page(lines: readonly string[]): string {
  return `${lines.join("\n").trimEnd()}\n`;
}

/** The number of names a package declares itself, across its entries. */
function ownNames(pkg: ApiPackage): number {
  return pkg.entries.reduce(
    (count, entry) => count + entry.symbols.filter((symbol) => symbol.kind !== "reexport").length,
    0,
  );
}

/**
 * The reference pages of one package: one page, or for a package with more than `splitAt` exported names, the
 * package page (facts, the `.` entry and file entries, links to the others) and one page per other code entry.
 *
 * @param pkg - the package with its symbols (from `readPackageApis`).
 * @param splitAt - the number of exported names above which each code entry but `.` gets its own page.
 * @returns the pages, the package page first, each ending with one newline.
 * @example
 * renderReferencePages(money)[0]?.path; // "customers/reference/money.mdx"
 */
export function renderReferencePages(pkg: ApiPackage, splitAt: number = SPLIT_AT): ReferencePage[] {
  const changelog = `${pkg.sourceUrl.replace("/tree/main/", "/blob/main/")}/CHANGELOG.md`;
  const runtimes =
    pkg.runtimes.length === 0 ? "—" : pkg.runtimes.map((runtime) => inlineCode(runtime)).join(", ");
  const split = ownNames(pkg) > splitAt;
  const own = (entry: ApiEntry): boolean =>
    !split || entry.kind === "file" || entry.subpath === ".";
  const lines = [
    ...head(
      pkg.name,
      `The TypeScript API of ${pkg.name} ${pkg.version}, generated from its TSDoc.`,
      pkg,
    ),
    ...(pkg.summary === "" ? [] : [prose(pkg.summary), ""]),
    "| Version | Category | Runtimes | Source |",
    "| ------- | -------- | -------- | ------ |",
    `| ${pkg.version} | ${inlineCode(pkg.category)} | ${runtimes} | [README](${pkg.sourceUrl}#readme) · [CHANGELOG](${changelog}) |`,
    "",
    "Every exported name of each entry point, as the source declares it (bodies and private members left out), with its TSDoc. Each section heading is the path to import from; the [package index](/customers/packages) lists every package.",
    "",
  ];
  const separate = pkg.entries.filter((entry) => !own(entry));
  if (separate.length > 0) {
    lines.push(
      `${pkg.name} exports ${ownNames(pkg)} names, so each of these entry points has its own page:`,
      "",
      "| Entry point | Names |",
      "| ----------- | ----- |",
      ...separate.map(
        (entry) =>
          `| [${inlineCode(importPath(pkg, entry))}](/${referencePath(pkg.name, entry.subpath)}) | ${entry.symbols.length} |`,
      ),
      "",
    );
  }
  for (const entry of pkg.entries.filter(own)) lines.push(...entrySection(pkg, entry));
  const pages: ReferencePage[] = [{ path: `${referencePath(pkg.name)}.mdx`, content: page(lines) }];
  for (const entry of separate) {
    const path = importPath(pkg, entry);
    pages.push({
      path: `${referencePath(pkg.name, entry.subpath)}.mdx`,
      content: page([
        ...head(
          path,
          `The TypeScript API of ${path} (${pkg.name} ${pkg.version}), generated from its TSDoc.`,
          pkg,
        ),
        `An entry point of [${inlineCode(pkg.name)}](/${referencePath(pkg.name)}) ${pkg.version}: every exported name, as the source declares it (bodies and private members left out), with its TSDoc.`,
        "",
        ...entrySection(pkg, entry),
      ]),
    });
  }
  return pages;
}
