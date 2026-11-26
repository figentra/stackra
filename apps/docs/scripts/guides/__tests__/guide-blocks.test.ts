/**
 * Stackra file contract:
 * Purpose: the drift check of the task guides (`src/docs/build-an-app/*.mdx`): every guide page has a folder of tested
 *          examples under `scripts/guides/<page>/`, and every TypeScript block on the page is copied from them, either a
 *          run of lines of an example or support file (a block titled with a file name must come from a file of that
 *          name) or a whole `// #region` of one, dedented; every SQL block is a run of the statements the guide's
 *          migrations compile to. A page block that no longer matches its example fails here, so the page cannot
 *          drift from the code the guide's tests run. The second set of guides (STA-2852) has no migrations, so its pages
 *          hold TypeScript blocks only.
 * Boundary: test only; reads the pages and the example files, compiles the migrations (pure, no database).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (the compiled SQL); STA-2843 (tested task guides);
 *                     STA-2852 (task guides II).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

import { compileMigration, type MacroClass, type MigrationClass } from "@stackra/database";
import { SearchableMacro } from "@stackra/search/node";
import { BelongsToTenantMacro } from "@stackra/tenancy/node";
import { describe, expect, it } from "@stackra/testing";

/** The guides' example folders and the guide pages. */
const GUIDES = fileURLToPath(new URL("../", import.meta.url));
const PAGES = fileURLToPath(new URL("../../../src/docs/build-an-app/", import.meta.url));
const SUPPORT = join(GUIDES, "support");

/** The macros any guide migration may call. */
const MACROS: readonly MacroClass[] = [BelongsToTenantMacro, SearchableMacro];

/** Each guide's module schema, as its tests compile it. */
const SCHEMAS: Readonly<Record<string, string>> = {
  "models-and-migrations": "projects",
  tenancy: "support",
  files: "support",
  search: "help",
};

/** One fenced block of a page. */
interface Block {
  readonly language: string;
  readonly title: string;
  readonly code: string;
}

/** One example or support file. */
interface Source {
  readonly file: string;
  readonly text: string;
}

/** The fenced blocks of an MDX page, in order. */
function blocksOf(page: string): Block[] {
  const blocks: Block[] = [];
  for (const match of page.matchAll(/^```(\w+)[ \t]*([^\n]*)\n([\s\S]*?)^```[ \t]*$/gm)) {
    const [, language = "", title = "", code = ""] = match;
    blocks.push({ language, title: title.trim(), code: code.trimEnd() });
  }
  return blocks;
}

/** The `.ts` files of `folder` and its sub-folders. */
function sourcesIn(folder: string): Source[] {
  return readdirSync(folder, { recursive: true, encoding: "utf8" })
    .filter((file) => file.endsWith(".ts"))
    .map((file) => join(folder, file))
    .map((file) => ({ file, text: readFileSync(file, "utf8") }));
}

/** `lines` without the indentation they all share. */
function dedent(lines: readonly string[]): string {
  const indents = lines
    .filter((line) => line.trim() !== "")
    .map((line) => /^ */.exec(line)?.[0].length ?? 0);
  const cut = Math.min(...indents);
  return lines.map((line) => line.slice(cut)).join("\n");
}

/** The dedented `// #region` bodies of a file. */
function regionsOf(text: string): string[] {
  const regions: string[] = [];
  for (const match of text.matchAll(
    /^[ \t]*\/\/ #region [\w-]+\n([\s\S]*?)^[ \t]*\/\/ #endregion/gm,
  ))
    regions.push(dedent((match[1] ?? "").trimEnd().split("\n")));
  return regions;
}

/** Whether `code` is a run of whole lines of `text`. */
function isRunOf(code: string, text: string): boolean {
  return `\n${text}\n`.includes(`\n${code}\n`);
}

/** Whether a TypeScript block is copied from one of `sources`. */
function copiedFrom(block: Block, sources: readonly Source[]): boolean {
  const named =
    block.title === ""
      ? sources
      : sources.filter((source) => basename(source.file) === basename(block.title));
  return named.some(
    (source) => isRunOf(block.code, source.text) || regionsOf(source.text).includes(block.code),
  );
}

/** The SQL the migrations of `folder` compile to in `schema`, each statement ended by `;`. */
async function compiledSql(folder: string, schema: string): Promise<string> {
  const files = readdirSync(folder)
    .filter((file) => file.endsWith(".migration.ts"))
    .sort();
  const statements: string[] = [];
  for (const [index, file] of files.entries()) {
    const exported = (await import(join(folder, file))) as Record<string, MigrationClass>;
    for (const migration of Object.values(exported)) {
      const { steps } = compileMigration(migration, {
        schema,
        createsSchema: index === 0,
        macros: MACROS,
      });
      for (const step of steps) statements.push(...step.sql.map((sql) => `${sql};`));
    }
  }
  return statements.join("\n");
}

/** The guide pages, by file name without `.mdx`. */
const pages = existsSync(PAGES)
  ? readdirSync(PAGES)
      .filter((file) => file.endsWith(".mdx"))
      .map((file) => file.replace(/\.mdx$/, ""))
  : [];

describe("task guide pages", () => {
  it("are there, the nine of the two sets at least", () => {
    expect(pages).toEqual(
      expect.arrayContaining([
        "models-and-migrations",
        "tenancy",
        "files",
        "search",
        "sign-in-and-permissions",
        "events-and-jobs",
        "notifications",
        "settings-and-flags",
        "observability",
      ]),
    );
  });

  describe.each(pages)("%s", (page) => {
    const folder = join(GUIDES, page);
    const blocks = blocksOf(readFileSync(join(PAGES, `${page}.mdx`), "utf8"));
    const typescript = blocks.filter((block) => ["ts", "typescript"].includes(block.language));

    it("has a folder of tested examples and at least one TypeScript block", () => {
      expect(existsSync(join(folder, "__tests__"))).toBe(true);
      expect(typescript.length).toBeGreaterThan(0);
    });

    it("copies every TypeScript block from its examples", () => {
      const sources = [...sourcesIn(folder), ...sourcesIn(SUPPORT)];
      const drifted = typescript.filter((block) => !copiedFrom(block, sources));
      expect(drifted.map((block) => `${block.title}\n${block.code}`)).toEqual([]);
    });

    it("copies every SQL block from what its migrations compile to", async () => {
      const sql = blocks.filter((block) => block.language === "sql");
      if (sql.length === 0) return;
      const compiled = await compiledSql(folder, SCHEMAS[page] ?? page);
      const drifted = sql.filter((block) => !isRunOf(block.code, compiled));
      expect(drifted.map((block) => block.code)).toEqual([]);
    });
  });

  it("would catch a block that drifted from its example", () => {
    const sources = sourcesIn(join(GUIDES, "models-and-migrations"));
    expect(
      copiedFrom(
        { language: "ts", title: "project.model.ts", code: '  status = "open";' },
        sources,
      ),
    ).toBe(false);
    expect(
      copiedFrom(
        { language: "ts", title: "project.model.ts", code: '  status = "active";' },
        sources,
      ),
    ).toBe(true);
  });
});
