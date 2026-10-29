/**
 * Stackra file contract:
 * Purpose: `SEARCH_REINDEX_COMMAND`, `stackra search:reindex [Model] [--scope-id <id> --scope-path <path>]
 *          [--since <ISO 8601>] [--semantic]`: queues a reindex job in the member's queue (every registered model when
 *          none is named, the vector passages with `--semantic`, only rows updated since an instant with `--since`) and
 *          prints the job id. A full rebuild resumes from the cursor a stopped one recorded.
 * Boundary: queues and returns through the member's `@stackra/data-maintenance/node` runner, the add-on that holds
 *           the reindex jobs (`data_maintenance.index.reindex`, `data_maintenance.index.reindex_semantic`); the
 *           member's workers run the job where its models are registered, and
 *           `stackra search:status` shows its progress. Without a scope the job is platform-wide. The CLI checks the
 *           spelling of what it can see (the scope, the instant); the job checks the model.
 * Runtime: node
 * Governing contract: ADR 0221 (decision 7: the reindex command); ADR 0404 (decision 3: run as a job); ADR 0282
 *                     (decision 3); ADR 0327 (decision 3).
 */
import { CliUsageError } from "#node/errors/cli-usage.error";
import { loadSearchRunner } from "#node/functions/load-search-runner.function";
import { settingsScope } from "#node/functions/settings-scope.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The `stackra search:reindex` command. */
export const SEARCH_REINDEX_COMMAND: CliCommand = {
  name: "search:reindex",
  summary: "Queue a search reindex job (resumable), optionally partial (--since) or semantic",
  usage:
    "stackra search:reindex [Model] [--scope-id <scp_…> --scope-path <path>] [--since <ISO 8601>] [--semantic]",
  options: {
    "scope-id": { type: "string" },
    "scope-path": { type: "string" },
    since: { type: "string" },
    semantic: { type: "boolean" },
  },
  positionals: true,
  async run({ cwd, positionals, values, io }) {
    const [model, ...extra] = positionals;
    if (extra.length > 0) throw new CliUsageError(`unexpected argument: ${extra[0]}`);
    const scoped = values["scope-id"] !== undefined || values["scope-path"] !== undefined;
    const scope = scoped ? settingsScope(values) : undefined;
    const since = values["since"];
    if (since !== undefined && (typeof since !== "string" || Number.isNaN(Date.parse(since))))
      throw new CliUsageError("give --since as an ISO 8601 instant, such as 2026-10-27T00:00:00Z");
    const semantic = values["semantic"] === true;
    const { job } = await (
      await loadSearchRunner(cwd)
    ).searchReindex({
      ...(model === undefined ? {} : { model }),
      ...(scope === undefined ? {} : { scope }),
      ...(typeof since === "string" ? { since: new Date(since).toISOString() } : {}),
      ...(semantic ? { semantic } : {}),
    });
    const target = `${model ?? "every model"} in ${scope?.path ?? "the platform"}`;
    io.out(
      job === undefined
        ? `search:reindex ${target}: a reindex of this scope already waits or runs\n`
        : `search:reindex ${target}: queued ${job}\n`,
    );
    return 0;
  },
};
