/**
 * Stackra file contract:
 * Purpose: `rewriteHashImports`, one source file's `#` specifiers rewritten as relative paths: in a static `import`,
 *          an `export … from`, a side-effect `import "#…"` and a dynamic `import("#…")`, each specifier the resolver
 *          answers becomes the path from the file to its target, without the `.ts` or `.tsx` extension.
 * Boundary: pure; text in, text out. A specifier the resolver cannot answer stays as written and is returned in
 *           `unresolved`, so the staging copy reports it rather than guessing. Only quoted `#` specifiers after `from`,
 *           `import` or `import(` are touched; a `#` in a string anywhere else is left alone.
 * Runtime: node
 * Governing contract: ADR 0091 (decision 2, amendment of 2026-11-09: the staging copy); ADR 0233 (`#` imports).
 */
import { dirname, relative, sep } from "node:path";

/** A quoted `#` specifier after `from`, `import` or `import(`. */
const HASH_SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(["'])(#[^"']+)\2/g;

/**
 * `text` of `file` with its `#` specifiers made relative.
 *
 * @param text - the file's source.
 * @param file - the file's path, where the relative paths start.
 * @param resolve - the file a specifier names, or undefined.
 * @returns the rewritten text and the specifiers left as written.
 * @example
 * rewriteHashImports('import { X } from "#core/x";', "/m/src/a.ts", () => "/m/src/core/x.ts");
 * // { text: 'import { X } from "./core/x";', unresolved: [] }
 */
export function rewriteHashImports(
  text: string,
  file: string,
  resolve: (specifier: string) => string | undefined,
): { readonly text: string; readonly unresolved: readonly string[] } {
  const unresolved: string[] = [];
  const next = text.replace(
    HASH_SPECIFIER,
    (whole, lead: string, quote: string, specifier: string) => {
      const target = resolve(specifier);
      if (target === undefined) {
        unresolved.push(specifier);
        return whole;
      }
      let path = relative(dirname(file), target)
        .split(sep)
        .join("/")
        .replace(/\.tsx?$/, "");
      if (!path.startsWith(".")) path = `./${path}`;
      return `${lead}${quote}${path}${quote}`;
    },
  );
  return { text: next, unresolved };
}
