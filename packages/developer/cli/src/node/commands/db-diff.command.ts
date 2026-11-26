/**
 * Stackra file contract:
 * Purpose: `DbDiffCommand`, `stackra db diff`: compares the member's models with the schema its compiled migrations build,
 *          one line per difference; exit 0 when they agree, 1 on a difference, 2 when nothing could be compared.
 *          `--json`: the differences. The body is `DB_DIFF_COMMAND`, unchanged.
 * Boundary: no database, no network: gen replays the migrations on an in-memory PGlite; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0159; ADR 0282 (decision 3); ADR 0014; ADR 0506; ADR 0500 (decision 7); STA-1808; STA-2883.
 */
import { Command, type CommandIo } from "@stackra/console";

import { DB_DIFF_COMMAND } from "#node/constants/db-diff-command.constant";
import { runBody } from "#node/functions/run-body.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** Compares the models with the migrations. */
export class DbDiffCommand extends Command({
  name: "db:diff",
  description: DB_DIFF_COMMAND.summary,
  group: "Database",
  bin: true,
  examples: ["stackra db diff", "stackra db diff --json"],
}) {
  /** The body it runs, unchanged; every option the body reads is a field here. */
  static readonly body: CliCommand = DB_DIFF_COMMAND;

  /** Compares; the exit code is 0, 1 or 2 as the body decides. */
  handle(io: CommandIo): Promise<number> {
    return runBody(io, DB_DIFF_COMMAND, {
      values: { json: io.json },
      toData: (output) => JSON.parse(output) as unknown,
    });
  }
}
