/**
 * Stackra file contract:
 * Purpose: `checkImports(path, text)`, ADR 0233 with the owner's rule of 2026-10-22: inside a member a TS import names no
 *          file extension and climbs at most one folder; a deeper reach uses the member's `#` alias.
 * Boundary: pure; JSON imports and `?url`/`?raw` assets are untouched.
 * Runtime: node
 * Governing contract: ADR 0233.
 */

/** Import specifiers in TS source: `from "…"`, `import "…"`, `import("…")` and the vitest module helpers. */
const IMPORT_SPECIFIER =
  /(?:\bfrom\s*|^\s*import\s+|\bimport\s*\(\s*|\bvi\.(?:mock|doMock|importActual)\(\s*)["']([^"'\n]+)["']/gm;
const TS_EXTENSION = /\.[cm]?[jt]sx?$/;
const DEEP_RELATIVE = /^(?:\.\.\/){2,}/;

/**
 * The import findings of one TS source file.
 *
 * @param path - repository-relative, used in the findings.
 * @param text - the file's contents.
 * @example
 * checkImports("a.ts", source); // one finding per extension and per climb of two or more folders
 */
export function checkImports(path: string, text: string): string[] {
  const out: string[] = [];
  for (const [, spec] of text.matchAll(IMPORT_SPECIFIER)) {
    if (spec === undefined || (!spec.startsWith(".") && !spec.startsWith("#"))) continue;
    if (TS_EXTENSION.test(spec))
      out.push(
        `${path}: import "${spec}" names a file extension; drop it (bundler resolution, ADR 0233)`,
      );
    if (DEEP_RELATIVE.test(spec) && !spec.endsWith(".json"))
      out.push(
        `${path}: import "${spec}" climbs two or more folders; use the member's # alias (ADR 0233)`,
      );
  }
  return out;
}
