/**
 * Stackra file contract:
 * Purpose: `isHooksTarget(path)`, whether the `hooks` phase of `stackra check` lints a file: a `.tsx` file in a component
 *          home (`src/{components,blocks,routes,react,native}/` or a `*.mail.tsx`), not a test, a fixture, generated
 *          output or a `use-*.tsx` file (the repository lint already checks those with `rules-of-hooks` on).
 * Boundary: pure; a repository-relative path with `/` separators.
 * Runtime: node
 * Governing contract: ADR 0305 (rules 37 to 41: hooks lint runs on the compiled output).
 */

/** The component homes whose `.tsx` files the repository lint leaves without `rules-of-hooks`. */
const HOME = /(^|\/)src\/(components|blocks|routes|react|native)\/.+\.tsx$|\.mail\.tsx$/;

/** What is never linted: tests, fixtures, generated output, installed code, hook files. */
const SKIPPED = /(^|\/)(__tests__|\.stackra|node_modules)\/|(^|\/)use-[^/]*\.tsx$/;

/**
 * Whether `path` is a file the `hooks` phase checks.
 *
 * @param path - repository-relative, `/` separated.
 * @example
 * isHooksTarget("packages/x/y/src/react/counter/counter.tsx"); // true
 * isHooksTarget("packages/x/y/src/react/counter/__tests__/counter.test.tsx"); // false
 */
export function isHooksTarget(path: string): boolean {
  return HOME.test(path) && !SKIPPED.test(path);
}
