/**
 * Stackra file contract:
 * Purpose: `SettingsApplyCommand`, `stackra settings:apply <pack.yaml> --scope-id <id> --scope-path <path> --author
 *          <id> [--reason <text>] [--env <environment>]`: makes a sandbox node's own values of the pack's groups equal
 *          the pack, one revision per changed group, and lists the revision ids (`--json`: the node, the environment
 *          and the revisions).
 * Boundary: reads the pack file and hands its text to the member's own `@stackra/settings/node`, which records every
 *           change as a sandbox revision with floors and locks checked; live configuration changes only by promotion.
 *           The author is a principal's public id, for the revision record; the CLI checks nothing it cannot see.
 * Runtime: node
 * Governing contract: ADR 0213 (decision 4); ADR 0359 (decisions 3 and 11); ADR 0395 (decision 5); ADR 0282 (decision
 *                     3); ADR 0506; STA-1966.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { Argument, Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { databaseEnvironment } from "#node/functions/database-environment.function";
import { loadSettingsRunner } from "#node/functions/load-settings-runner.function";
import { settingsScope } from "#node/functions/settings-scope.function";

/** Applies a settings pack to a sandbox scope node. */
export class SettingsApplyCommand extends Command({
  name: "settings:apply",
  description: "Apply a settings pack to a sandbox scope node, recording each change as a revision",
  bin: true,
}) {
  /** The pack file. */
  @Argument({ description: "The settings pack, a YAML file" })
  pack!: string;

  /** The node's public id. */
  @Option({ description: "The sandbox scope node's public id, scp_<26 characters>" })
  @Str
  scopeId?: string;

  /** The node's path. */
  @Option({ description: "The sandbox scope node's ltree path, <label>.<label>" })
  @Str
  scopePath?: string;

  /** Who applies it. */
  @Option({ description: "The principal's public id the revisions are recorded under" })
  @Str
  author?: string;

  /** Why the change is made, kept on each revision. */
  @Option({ description: "Why, kept on each revision" })
  @Str
  reason?: string;

  /** The target environment. */
  @Option({
    description:
      "dev, preview, test, staging or production (default: STACKRA_ENVIRONMENT, else dev)",
  })
  @Str
  env?: string;

  /** Applies the pack and returns the revisions. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    const scope = settingsScope({ "scope-id": this.scopeId, "scope-path": this.scopePath });
    const author = this.author;
    if (author === undefined || author.trim() === "")
      throw new CliUsageError("name the author: --author <principal id>");
    const environment = databaseEnvironment({ env: this.env });
    const yaml = readFileSync(resolve(io.cwd, this.pack), "utf8");
    const { revisions } = await (
      await loadSettingsRunner(io.cwd)
    ).settingsApply({
      cwd: io.cwd,
      environment,
      scope,
      yaml,
      author,
      ...(this.reason === undefined ? {} : { reason: this.reason }),
    });
    io.output.success(
      `settings:apply ${scope.path} (${environment}): ${revisions.length} revision${revisions.length === 1 ? "" : "s"}`,
    );
    if (revisions.length > 0) io.output.list(revisions);
    return { scope, environment, revisions };
  }
}
