/**
 * Stackra file contract:
 * Purpose: `SEARCH_STATUS_COMMAND`, `stackra search:status`: prints every index of the member's registry, one line
 *          each: model, scope, state, document count, the resume cursor of a rebuild in progress and the last rebuild.
 * Boundary: reads only, through the member's own `@stackra/search/node`; the registry holds states and counts, never
 *           row data.
 * Runtime: node
 * Governing contract: ADR 0404 (decision 3); ADR 0221 (decision 7); ADR 0282 (decision 3).
 */
import { CliUsageError } from "#node/errors/cli-usage.error";
import { loadSearchRunner } from "#node/functions/load-search-runner.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The `stackra search:status` command. */
export const SEARCH_STATUS_COMMAND: CliCommand = {
  name: "search:status",
  summary: "Show each search index's state, document count and rebuild progress",
  usage: "stackra search:status",
  positionals: true,
  async run({ cwd, positionals, io }) {
    if (positionals.length > 0) throw new CliUsageError(`unexpected argument: ${positionals[0]}`);
    const indexes = await (await loadSearchRunner(cwd)).searchStatus();
    io.out(
      `search:status: ${indexes.length} index${indexes.length === 1 ? "" : "es"}\n` +
        indexes
          .map(
            (index) =>
              `  ${index.model} ${index.scope?.path ?? "platform"}: ${index.state}, ${index.docCount} documents` +
              (index.cursor === undefined ? "" : `, resumes after ${index.cursor}`) +
              (index.rebuiltAt === undefined ? "" : `, rebuilt ${index.rebuiltAt.toISOString()}`) +
              "\n",
          )
          .join(""),
    );
    return 0;
  },
};
