/**
 * Stackra file contract:
 * Purpose: `shrinkRouteSource`, a route module without its `title` and `category` statics and the `PageCategory`
 *          import: the class keeps `path` (and `ownsMain`); an empty body collapses to `{}`.
 * Boundary: a pure function of the shrink-routes codemod; string replacements over the house-shaped route file.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 2.2 (ADR 0294 rule R7 amended).
 */

/** The shrunk route module. */
export function shrinkRouteSource(source: string): string {
  return (
    source
      .replace(/\n\s*\/\*\*[^\n]*\*\/\n\s*static readonly title = "[^"]*";\n/, "\n")
      .replace(
        /\n\s*\/\*\*[^\n]*\*\/\n\s*static readonly category: PageCategory = "[^"]*";\n/,
        "\n",
      )
      .replace(/\nimport type \{ PageCategory \} from "#src\/enums\/page-category.enum";\n/, "\n")
      .replace(/\n\n(\s*)\}/, "\n$1}")
      // The statics went from the top of the class body: no blank line opens it.
      .replace(/\) \{\n\n(?=\s*\S)/, ") {\n")
      .replace(/\{\n\s*\}/, "{}")
      .replace("its path, title and category.", "its path.")
      .replaceAll(/\n\n\n+/g, "\n\n")
  );
}
