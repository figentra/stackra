/**
 * Stackra file contract:
 * Purpose: proves no entry of @stackra/ui except `./rich-text` reaches `@tiptap/*`, so a shell that loads `./react`
 *          builds without the optional TipTap peers (STA-1895).
 * Boundary: reads source only; follows `#` alias and relative imports from each entry's source file.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); STA-1895.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const IMPORT = /(?:from|import)\s*\(?\s*["']([^"']+)["']/g;

function resolveFile(from: string, specifier: string): string | undefined {
  const base = specifier.startsWith("#")
    ? resolve(SRC, specifier.slice(1))
    : specifier.startsWith(".")
      ? resolve(dirname(from), specifier)
      : undefined;
  if (base === undefined) return undefined;
  return [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`].find(
    (candidate) => existsSync(candidate) && /\.tsx?$/.test(candidate),
  );
}

/** Every bare package specifier the entry's source graph imports. */
function packagesOf(entry: string): Set<string> {
  const seen = new Set<string>();
  const packages = new Set<string>();
  const visit = (file: string): void => {
    if (seen.has(file)) return;
    seen.add(file);
    for (const match of readFileSync(file, "utf8").matchAll(IMPORT)) {
      const specifier = match[1] ?? "";
      const next = resolveFile(file, specifier);
      if (next) visit(next);
      else if (!specifier.startsWith("#") && !specifier.startsWith(".")) packages.add(specifier);
    }
  };
  visit(resolve(SRC, entry));
  return packages;
}

describe("entry boundaries", () => {
  it.each([
    "core/index.ts",
    "contracts/index.ts",
    "form/index.ts",
    "node/ui.module.ts",
    "react/index.ts",
    "native/index.ts",
  ])("%s does not reach @tiptap/*", (entry) => {
    expect([...packagesOf(entry)].filter((name) => name.startsWith("@tiptap/"))).toEqual([]);
  });

  it("react/rich-text-editor/index.ts is the entry that reaches @tiptap/*", () => {
    expect(
      [...packagesOf("react/rich-text-editor/index.ts")].some((n) => n.startsWith("@tiptap/")),
    ).toBe(true);
  });
});
