/**
 * Stackra file contract:
 * Purpose: `devLogQuery(root, filter)`, the dev log entries a tool asks for, oldest first: read from the repository's
 *          dev log (`readDevLog` of `devLogFile`), narrowed by source, the lowest level kept, member folder, browser
 *          report kind, a start time and a text (any case, in the message or the stack); with the log's path from the
 *          root.
 * Boundary: reads the dev log only. No log yet is a `CommandError` whose fix is `stackra dev`, so an assistant knows
 *           why there is nothing to read.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: the local MCP reads the app); ADR 0296 (decision 1); STA-2889.
 */
import { existsSync } from "node:fs";
import { relative } from "node:path";

import { CommandError } from "@stackra/console";
import type { DevLogEntry } from "@stackra/runway";
import { devLogFile, readDevLog } from "@stackra/runway/node";

import { DEV_LOG_LEVELS } from "#node/constants/dev-log-levels.constant";
import type { DevLogFilter } from "#node/types/dev-log-filter.type";

/**
 * The dev log entries `filter` keeps.
 *
 * @param root - the repository root.
 * @param filter - what to keep; everything when empty.
 * @throws CommandError when the repository has no dev log yet.
 * @example
 * devLogQuery("/repo", { level: "warn", since: new Date(Date.now() - 900_000) }).entries;
 */
export function devLogQuery(
  root: string,
  filter: DevLogFilter,
): { readonly file: string; readonly entries: DevLogEntry[] } {
  const file = devLogFile(root);
  const shown = relative(root, file) || file;
  if (!existsSync(file))
    throw new CommandError(`No dev log yet at ${shown}`, {
      fix: "run `stackra dev` in the member (or at the root), then try again",
    });
  const lowest = filter.level === undefined ? 0 : DEV_LOG_LEVELS.indexOf(filter.level);
  const needle = filter.search?.toLowerCase();
  const since = filter.since?.getTime();
  const entries = readDevLog(file).filter(
    (entry) =>
      (filter.source === undefined || entry.source === filter.source) &&
      DEV_LOG_LEVELS.indexOf(entry.level) >= lowest &&
      (filter.member === undefined || entry.member === filter.member) &&
      (filter.kind === undefined || entry.kind === filter.kind) &&
      (since === undefined || Date.parse(entry.time) >= since) &&
      (needle === undefined ||
        entry.message.toLowerCase().includes(needle) ||
        (entry.stack?.toLowerCase().includes(needle) ?? false)),
  );
  return { file: shown, entries };
}
