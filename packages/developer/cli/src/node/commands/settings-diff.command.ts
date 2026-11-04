/**
 * Stackra file contract:
 * Purpose: `SettingsDiffCommand`, `stackra settings:diff <pack.yaml> --scope-id <id> --scope-path <path> [--env
 *          <environment>]`: shows what applying a settings pack at a scope node would change, as a table of settings
 *          with their values before and after and any lock change (`--json`: the node, the environment and the rows).
 * Boundary: reads the pack file and hands its text to the member's own `@stackra/settings/node`, which parses it and
 *           reads the node's values; the CLI holds no settings code and no database driver. Reads only.
 * Runtime: node
 * Governing contract: ADR 0213 (decision 4); ADR 0280 (decision 4: a reviewed diff); ADR 0395 (decision 5); ADR 0282
 *                     (decision 3); ADR 0506; STA-1966.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { Argument, Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { databaseEnvironment } from "#node/functions/database-environment.function";
import { loadSettingsRunner } from "#node/functions/load-settings-runner.function";
import { settingsScope } from "#node/functions/settings-scope.function";

/** A diff value as shown; an absent one is unset. */
const show = (value: unknown): string => (value === undefined ? "(unset)" : JSON.stringify(value));

/** Shows what a settings pack would change at a scope node. */
export class SettingsDiffCommand extends Command({
  name: "settings:diff",
  description: "Show what a settings pack would change at a scope node",
  bin: true,
}) {
  /** The pack file. */
  @Argument({ description: "The settings pack, a YAML file" })
  pack!: string;

  /** The node's public id. */
  @Option({ description: "The scope node's public id, scp_<26 characters>" })
  @Str
  scopeId?: string;

  /** The node's path. */
  @Option({ description: "The scope node's ltree path, <label>.<label>" })
  @Str
  scopePath?: string;

  /** The target environment. */
  @Option({
    description:
      "dev, preview, test, staging or production (default: STACKRA_ENVIRONMENT, else dev)",
  })
  @Str
  env?: string;

  /** Diffs the pack and returns the rows. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    const scope = settingsScope({ "scope-id": this.scopeId, "scope-path": this.scopePath });
    const environment = databaseEnvironment({ env: this.env });
    const yaml = readFileSync(resolve(io.cwd, this.pack), "utf8");
    const rows = await (
      await loadSettingsRunner(io.cwd)
    ).settingsDiff({ cwd: io.cwd, environment, scope, yaml });
    const label = `settings:diff ${scope.path} (${environment})`;
    if (rows.length === 0) io.output.info(`${label}: no changes`);
    else
      io.output.table({
        title: `${label}: ${rows.length} change${rows.length === 1 ? "" : "s"}`,
        columns: [
          { header: "Setting", key: "setting" },
          { header: "Before", key: "before" },
          { header: "After", key: "after" },
          { header: "Lock", key: "lock" },
        ],
        rows: rows.map((row) => ({
          setting: `${row.group}.${row.path}`,
          before: show(row.before),
          after: show(row.after),
          lock: row.lockedBefore === row.lockedAfter ? "" : row.lockedAfter ? "locks" : "unlocks",
        })),
      });
    return { scope, environment, changes: rows };
  }
}
