/**
 * Stackra file contract:
 * Purpose: `resolveMember(cwd, member)`, the service the feature kinds of `stackra new` write into: `--member` when
 *          given, else the nearest folder at or above `cwd` that holds a `stackra.config.ts`, below the workspace root.
 * Boundary: reads files only. Refuses a folder that is not a service (its `stackra.config.ts` calls no
 *           `defineService`): feature modules live in services (ADR 0259 as amended by 0294).
 * Runtime: node
 * Governing contract: ADR 0294 (decision 13: modules under `src/modules/`); ADR 0295 (the member definition).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { CliUsageError } from "#node/errors/cli-usage.error";

/**
 * The service folder.
 *
 * @param cwd - where the command runs.
 * @param member - `--member`, relative to `cwd`.
 * @throws CliUsageError when no service is found.
 * @example
 * resolveMember("/repo/services/shop/src", undefined); // "/repo/services/shop"
 */
export function resolveMember(cwd: string, member: string | undefined): string {
  let found: string | undefined;
  if (member !== undefined) found = resolve(cwd, member);
  else
    for (let folder = cwd; ; folder = dirname(folder)) {
      if (existsSync(join(folder, "pnpm-workspace.yaml"))) break;
      if (existsSync(join(folder, "stackra.config.ts"))) {
        found = folder;
        break;
      }
      if (dirname(folder) === folder) break;
    }
  const config = found === undefined ? undefined : join(found, "stackra.config.ts");
  if (found === undefined || config === undefined || !existsSync(config))
    throw new CliUsageError(
      "run it inside a service (a folder whose stackra.config.ts calls defineService), or pass --member services/<name>",
    );
  if (!readFileSync(config, "utf8").includes("defineService("))
    throw new CliUsageError(
      `${found} is not a service: feature modules live in a service (its stackra.config.ts calls defineService)`,
    );
  return found;
}
