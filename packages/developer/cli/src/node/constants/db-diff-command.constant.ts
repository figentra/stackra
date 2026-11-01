/**
 * Stackra file contract:
 * Purpose: `DB_DIFF_COMMAND`, `stackra db diff [--json]`: compares the member's models with the schema its compiled
 *          migrations build. It prints one line per difference, `<module>  <table>  <kind>  <subject>  <expected>
 *          <actual>`, or `--json` as an array of the same fields. Exit 0 when they agree (or there is nothing to
 *          compare), 1 on a difference, 2 when a migration does not compile or replay, the member is refused by gen, or
 *          `@stackra/database` or PGlite is missing.
 * Boundary: no database, no network, no secret: gen replays the migrations on an in-memory PGlite through the member's
 *           own `@stackra/database/node`, so this CLI holds no database driver. Writes nothing; `db diff --write` and
 *           `db structure` are separate stories.
 * Runtime: node
 * Governing contract: ADR 0159 (migrations; the model is the declaration); ADR 0282 (decision 3: `stackra db diff`);
 *                     ADR 0014 (only `@stackra/database` holds the driver); STA-1808.
 */
import { formatGenError, formatSchemaDifference } from "@stackra/gen";
import { checkMigrationDrift } from "@stackra/gen/node";

import type { CliCommand } from "#node/types/cli-command.type";

/** `stackra db diff`. */
export const DB_DIFF_COMMAND: CliCommand = {
  name: "db diff",
  summary: "Compare the member's models with the schema its migrations build (no database needed)",
  usage: "stackra db diff [--json]",
  options: { json: { type: "boolean" } },
  async run({ cwd, values, io }) {
    const json = values["json"] === true;
    let drift: Awaited<ReturnType<typeof checkMigrationDrift>>;
    try {
      drift = await checkMigrationDrift(cwd);
    } catch (error) {
      io.err(`db diff: ${error instanceof Error ? error.message : String(error)}\n`);
      return 2;
    }
    if (drift.errors.length > 0) {
      for (const error of drift.errors) io.err(`${formatGenError(error)}\n`);
      io.err(`db diff: ${drift.errors.length} error(s) in ${drift.member}; nothing was compared\n`);
      return 2;
    }
    if (json) io.out(`${JSON.stringify(drift.differences, null, 2)}\n`);
    if (drift.differences.length === 0) {
      if (!json)
        io.out(
          drift.compared
            ? `db diff: ${drift.member} agrees with its models\n`
            : `db diff: ${drift.member} has nothing to compare\n`,
        );
      return 0;
    }
    if (!json)
      for (const difference of drift.differences) io.out(`${formatSchemaDifference(difference)}\n`);
    io.err(`db diff: ${drift.differences.length} difference(s) in ${drift.member}\n`);
    return 1;
  },
};
