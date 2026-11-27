/**
 * Stackra file contract:
 * Purpose: `toolEnv(cwd, extra, base?)`, the environment a tool process starts with: `base` (this process's
 *          environment), then `extra`, then one `PATH` with every `node_modules/.bin` from `cwd` up to the filesystem
 *          root in front of the inherited one, so a member's own pinned tools win.
 * Boundary: pure; reads `process.env` only as the default `base`. Windows spells the variable `Path` and matches it
 *           without regard to case, so every other spelling is dropped: a child given both `Path` and `PATH` would
 *           search either one, and the `node_modules/.bin` folders would not always come first.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5); STA-2899 (Windows-safe process runners).
 */
import { delimiter, dirname, join } from "node:path";

/** Whether `key` names the search path, in any spelling Windows accepts. */
const isPathKey = (key: string): boolean => key.toUpperCase() === "PATH";

/**
 * The environment of a tool started in `cwd`.
 *
 * @param cwd - the tool's working directory; its `node_modules/.bin` and every one above it go first on `PATH`.
 * @param extra - variables the run adds or overrides (a `PATH` here is the inherited path the bins go in front of).
 * @param base - the inherited environment (default: this process's).
 * @example
 * spawn("vitest", ["run"], { cwd, env: toolEnv(cwd, { CI: "1" }) });
 */
export function toolEnv(
  cwd: string,
  extra: Readonly<Record<string, string | undefined>> = {},
  base: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  const merged: NodeJS.ProcessEnv = { ...base, ...extra };
  // The last spelling wins, as `extra` is spread after `base`.
  const inherited = Object.entries(merged)
    .filter(([key]) => isPathKey(key))
    .map(([, value]) => value)
    .findLast((value) => value !== undefined);
  const env: NodeJS.ProcessEnv = Object.fromEntries(
    Object.entries(merged).filter(([key]) => !isPathKey(key)),
  );
  const bins: string[] = [];
  for (let folder = cwd; ; folder = dirname(folder)) {
    bins.push(join(folder, "node_modules", ".bin"));
    if (dirname(folder) === folder) break;
  }
  env["PATH"] = [...bins, ...(inherited ? [inherited] : [])].join(delimiter);
  return env;
}
