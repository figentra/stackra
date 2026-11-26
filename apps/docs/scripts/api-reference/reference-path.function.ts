/**
 * Stackra file contract:
 * Purpose: `referencePath(name, subpath)`, a package's (or one of its entry points') reference page path under
 *          `src/docs`, without the extension.
 * Boundary: pure. An entry page sits beside the package page as `<name>--<entry>`, so the one `{ folder }` navigation
 *           entry lists it and no name of a package (which never holds `--`) can collide with it.
 * Runtime: node
 * Governing contract: STA-2857.
 */

/**
 * The page of a package, or of one of its entry points, relative to `src/docs` and without the extension.
 *
 * @param name - the package name (`@stackra/ui`).
 * @param subpath - an entry's subpath (`./react`); omitted or `.` for the package page.
 * @returns `customers/reference/ui`, or `customers/reference/ui--react` for the `./react` entry.
 * @example
 * referencePath("@stackra/ui", "./rich-text"); // "customers/reference/ui--rich-text"
 */
export function referencePath(name: string, subpath = "."): string {
  const base = `customers/reference/${name.replace(/^@[^/]+\//, "")}`;
  if (subpath === ".") return base;
  return `${base}--${subpath.replace(/^\.\//, "").replaceAll("/", "-")}`;
}
