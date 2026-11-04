/**
 * Stackra file contract:
 * Purpose: `toolPath(cwd)`, the `PATH` a tool starts with: every `node_modules/.bin` from `cwd` up to the filesystem
 *          root, then the inherited `PATH`, so the member's own pinned tools win.
 * Boundary: pure apart from reading `PATH`; checks no folder exists.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5).
 */
import { delimiter, dirname, join } from "node:path";

/**
 * `PATH` with every `node_modules/.bin` from `cwd` to the filesystem root in front.
 *
 * @example
 * spawn("vitest", ["run"], { env: { ...process.env, PATH: toolPath(root) } });
 */
export function toolPath(cwd: string): string {
  const bins: string[] = [];
  for (let folder = cwd; ; folder = dirname(folder)) {
    bins.push(join(folder, "node_modules", ".bin"));
    if (dirname(folder) === folder) break;
  }
  return [...bins, process.env["PATH"] ?? ""].join(delimiter);
}
