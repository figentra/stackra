/**
 * Stackra file contract:
 * Purpose: `devLogFile(from)`, the absolute path of the dev log of the repository `from` is in: `DEV_LOG_PATH` under
 *          the nearest folder at or above `from` that holds `pnpm-workspace.yaml`, or under `from` itself when none
 *          does. `stackra dev`, the Vite dev server and the local MCP all find the one file through it.
 * Boundary: reads folder existence only; never creates the file.
 * Runtime: node
 * Governing contract: ADR 0296 (decisions 1 and 2: one repository root, dev facts under it); STA-2889.
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

import { DEV_LOG_PATH } from "#core/constants/dev-log-path.constant";

/**
 * The dev log file of the repository around `from`.
 *
 * @param from - an absolute folder inside the repository: a member folder or the root.
 * @example
 * devLogFile("/work/acme/apps/console"); // "/work/acme/.stackra/logs/dev.ndjson"
 */
export function devLogFile(from: string): string {
  for (let folder = from; ; folder = dirname(folder)) {
    if (existsSync(join(folder, "pnpm-workspace.yaml"))) return join(folder, DEV_LOG_PATH);
    if (dirname(folder) === folder) return join(from, DEV_LOG_PATH);
  }
}
