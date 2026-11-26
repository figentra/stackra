/**
 * Stackra file contract:
 * Purpose: `writeApiReference`, the step that regenerates the TypeScript API reference: it lists every published
 *          package (`listPackages`), reads the exported symbols of each entry with one TypeScript program
 *          (`readPackageApis`), renders the package index and one page per package (`renderApiReference`) and writes
 *          them into `src/docs` (`customers/packages.mdx`, `customers/reference/<name>.mdx`), removing the page of a
 *          package that is gone. With `--check` it writes nothing and fails when a committed page differs, is missing
 *          or is stale (`pnpm validate` runs it, so the index and the reference never drift from the packages). Run as
 *          `node apps/docs/scripts/api-reference/write-api-reference.ts [--check]` (Node strips the types; the parts
 *          are imported as `#scripts/api-reference/<file>`, which `imports` in package.json maps to their `.ts`).
 * Boundary: reads `packages/*\/*` and writes only the index page and `.mdx` files in the reference folder.
 * Runtime: node
 * Governing contract: ADR 0007 (docblock standard); ADR 0514 (Fumadocs); STA-1575; STA-2857.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { ApiReferenceResult } from "#scripts/api-reference/api-reference-result.type";
import { driftOf } from "#scripts/api-reference/drift-of.function";
import { listPackages } from "#scripts/api-reference/list-packages.function";
import { readPackageApis } from "#scripts/api-reference/read-package-apis.function";
import { INDEX_PAGE } from "#scripts/api-reference/index-page.constant";
import { REFERENCE_DIR } from "#scripts/api-reference/reference-dir.constant";
import { renderApiReference } from "#scripts/api-reference/render-api-reference.function";
import { REGENERATE_COMMAND } from "#scripts/api-reference/regenerate-command.constant";

/** This script's folder. */
const HERE = dirname(fileURLToPath(import.meta.url));

/** The committed generated pages: the index and every `.mdx` of the reference folder. */
function committedPages(docsDir: string): Map<string, string> {
  const pages = new Map<string, string>();
  const index = join(docsDir, INDEX_PAGE);
  if (existsSync(index)) pages.set(INDEX_PAGE, readFileSync(index, "utf8"));
  const folder = join(docsDir, REFERENCE_DIR);
  if (existsSync(folder)) {
    for (const file of readdirSync(folder)) {
      if (file.endsWith(".mdx"))
        pages.set(`${REFERENCE_DIR}/${file}`, readFileSync(join(folder, file), "utf8"));
    }
  }
  return pages;
}

/**
 * Regenerates (or checks) the API reference pages.
 *
 * @param options - `root`: the repository root (defaults to the one holding this script); `docsDir`: the pages
 *                  folder (defaults to `apps/docs/src/docs`); `check`: compare instead of writing.
 * @returns the written page paths, or in check mode the drift lines and whether there were none.
 * @throws Error when a package's `exports` points at a missing file.
 * @example
 * writeApiReference({ check: true }).ok; // true when the committed pages are current
 */
export function writeApiReference(
  options: { readonly root?: string; readonly docsDir?: string; readonly check?: boolean } = {},
): ApiReferenceResult {
  const root = options.root ?? resolve(HERE, "../../../..");
  const docsDir = options.docsDir ?? resolve(HERE, "../../src/docs");
  const pages = renderApiReference(readPackageApis(root, listPackages(root)));
  const committed = committedPages(docsDir);
  if (options.check === true) {
    const drift = driftOf(pages, committed);
    return { lines: drift, ok: drift.length === 0 };
  }
  for (const path of committed.keys()) {
    if (!pages.has(path)) rmSync(join(docsDir, path));
  }
  const written: string[] = [];
  for (const [path, content] of pages) {
    if (committed.get(path) === content) continue;
    const target = join(docsDir, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
    written.push(path);
  }
  return { lines: written, ok: true };
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]) {
  const check = process.argv.includes("--check");
  const result = writeApiReference({ check });
  if (check && !result.ok) {
    process.stderr.write(
      `api-reference: the generated API reference differs from the packages (${result.lines.length} ${result.lines.length === 1 ? "page" : "pages"}):\n` +
        result.lines.map((line) => `  ${line}\n`).join("") +
        `run \`${REGENERATE_COMMAND}\` and commit the pages.\n`,
    );
    process.exitCode = 1;
  } else if (check) {
    process.stdout.write("api-reference: the package index and the reference pages are current\n");
  } else {
    for (const path of result.lines) process.stdout.write(`${path}\n`);
  }
}
