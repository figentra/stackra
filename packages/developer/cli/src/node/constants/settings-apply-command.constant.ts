/**
 * Stackra file contract:
 * Purpose: `SETTINGS_APPLY_COMMAND`, `stackra settings:apply <pack.yaml> --scope-id <id> --scope-path <path> --author
 *          <id> [--reason <text>] [--env <environment>]`: makes a sandbox node's own values of the pack's groups equal
 *          the pack, one revision per changed group, and prints the revision ids.
 * Boundary: reads the pack file and hands its text to the member's own `@stackra/settings/node`, which records every
 *           change as a sandbox revision with floors and locks checked; live configuration changes only by promotion.
 *           The author is a principal's public id, for the revision record; the CLI checks nothing it cannot see.
 * Runtime: node
 * Governing contract: ADR 0213 (decision 4); ADR 0359 (decisions 3 and 11); ADR 0395 (decision 5); ADR 0282 (decision
 *                     3).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { databaseEnvironment } from "#node/functions/database-environment.function";
import { loadSettingsRunner } from "#node/functions/load-settings-runner.function";
import { settingsScope } from "#node/functions/settings-scope.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The `stackra settings:apply` command. */
export const SETTINGS_APPLY_COMMAND: CliCommand = {
  name: "settings:apply",
  summary: "Apply a settings pack to a sandbox scope node, recording each change as a revision",
  usage:
    "stackra settings:apply <pack.yaml> --scope-id <scp_…> --scope-path <path> --author <id> [--reason <text>] [--env <environment>]",
  options: {
    "scope-id": { type: "string" },
    "scope-path": { type: "string" },
    author: { type: "string" },
    reason: { type: "string" },
    env: { type: "string" },
  },
  positionals: true,
  async run({ cwd, positionals, values, io }) {
    const [file, ...extra] = positionals;
    if (file === undefined)
      throw new CliUsageError("name the pack: stackra settings:apply <pack.yaml>");
    if (extra.length > 0) throw new CliUsageError(`unexpected argument: ${extra[0]}`);
    const scope = settingsScope(values);
    const author = values["author"];
    if (typeof author !== "string" || author.trim() === "")
      throw new CliUsageError("name the author: --author <principal id>");
    const reason = values["reason"];
    const environment = databaseEnvironment(values);
    const yaml = readFileSync(resolve(cwd, file), "utf8");
    const { revisions } = await (
      await loadSettingsRunner(cwd)
    ).settingsApply({
      cwd,
      environment,
      scope,
      yaml,
      author,
      ...(typeof reason === "string" ? { reason } : {}),
    });
    io.out(
      `settings:apply ${scope.path} (${environment}): ${revisions.length} revision${revisions.length === 1 ? "" : "s"}\n` +
        revisions.map((id) => `  ${id}\n`).join(""),
    );
    return 0;
  },
};
