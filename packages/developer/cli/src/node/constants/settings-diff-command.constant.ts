/**
 * Stackra file contract:
 * Purpose: `SETTINGS_DIFF_COMMAND`, `stackra settings:diff <pack.yaml> --scope-id <id> --scope-path <path>
 *          [--env <environment>]`: prints what applying a settings pack at a scope node would change, row by row.
 * Boundary: reads the pack file and hands its text to the member's own `@stackra/settings/node`, which parses it and
 *           reads the node's values; the CLI holds no settings code and no database driver. Reads only.
 * Runtime: node
 * Governing contract: ADR 0213 (decision 4); ADR 0280 (decision 4: a reviewed diff); ADR 0395 (decision 5); ADR 0282
 *                     (decision 3).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { databaseEnvironment } from "#node/functions/database-environment.function";
import { loadSettingsRunner } from "#node/functions/load-settings-runner.function";
import { settingsScope } from "#node/functions/settings-scope.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** A diff value as printed; an absent one is unset. */
function show(value: unknown): string {
  return value === undefined ? "(unset)" : JSON.stringify(value);
}

/** The `stackra settings:diff` command. */
export const SETTINGS_DIFF_COMMAND: CliCommand = {
  name: "settings:diff",
  summary: "Show what a settings pack would change at a scope node",
  usage:
    "stackra settings:diff <pack.yaml> --scope-id <scp_…> --scope-path <path> [--env <environment>]",
  options: {
    "scope-id": { type: "string" },
    "scope-path": { type: "string" },
    env: { type: "string" },
  },
  positionals: true,
  async run({ cwd, positionals, values, io }) {
    const [file, ...extra] = positionals;
    if (file === undefined)
      throw new CliUsageError("name the pack: stackra settings:diff <pack.yaml>");
    if (extra.length > 0) throw new CliUsageError(`unexpected argument: ${extra[0]}`);
    const scope = settingsScope(values);
    const environment = databaseEnvironment(values);
    const yaml = readFileSync(resolve(cwd, file), "utf8");
    const rows = await (
      await loadSettingsRunner(cwd)
    ).settingsDiff({ cwd, environment, scope, yaml });
    io.out(
      `settings:diff ${scope.path} (${environment}): ${rows.length} change${rows.length === 1 ? "" : "s"}\n` +
        rows
          .map(
            (row) =>
              `  ${row.group}.${row.path}: ${show(row.before)} -> ${show(row.after)}` +
              (row.lockedBefore === row.lockedAfter
                ? ""
                : row.lockedAfter
                  ? " (locks)"
                  : " (unlocks)") +
              "\n",
          )
          .join(""),
    );
    return 0;
  },
};
