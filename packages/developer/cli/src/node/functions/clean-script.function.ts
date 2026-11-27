/**
 * Stackra file contract:
 * Purpose: `cleanScript(paths)`, the `clean` package script of a member `stackra new` writes: removes each path
 *          (a folder with everything in it, or a file), and a path that is not there is no error.
 * Boundary: pure; returns the script text. The script runs under any shell a package manager uses (sh on macOS,
 *           Linux and WSL; cmd.exe on Windows): it is one `node -e` with double quotes outside and none inside, and
 *           no `rm`, which Windows does not have; `process.getBuiltinModule` (Node 22.3 and later; Stackra needs 24) keeps
 *           a literal `require` out of the CLI bundle. Only plain relative names are accepted, so no path is parsed as
 *           shell syntax.
 * Runtime: node
 * Governing contract: STA-2899 (portable member scripts); ADR 0295 (decision 5: members call `stackra` and node).
 */

/** One path segment with nothing a shell would read: letters, digits, `.`, `_` and `-`. */
const SEGMENT = /^[\w.-]+$/u;

/** Whether `path` is relative, below the member and plain in every segment. */
const plain = (path: string): boolean =>
  path.split("/").every((part) => SEGMENT.test(part) && part !== "." && part !== "..");

/**
 * The script that removes `paths` from the member folder.
 *
 * @param paths - the folders and files to remove, relative to the member (`dist`, `.turbo`).
 * @example
 * cleanScript(["dist", "coverage"]);
 * // node -e "for (const p of process.argv.slice(1)) process.getBuiltinModule('node:fs').rmSync(p, { recursive: true, force: true })" dist coverage
 */
export function cleanScript(paths: readonly string[]): string {
  const bad = paths.find((path) => !plain(path));
  if (bad !== undefined)
    throw new Error(`cleanScript: ${JSON.stringify(bad)} is not a plain relative path`);
  return [
    `node -e "for (const p of process.argv.slice(1)) process.getBuiltinModule('node:fs').rmSync(p, { recursive: true, force: true })"`,
    ...paths,
  ].join(" ");
}
