/**
 * Stackra file contract:
 * Purpose: `SearchReindexCommand`, `stackra search:reindex [Model] [--scope-id <id> --scope-path <path>] [--since
 *          <ISO 8601>] [--semantic]`: queues a reindex job in the member's queue (every registered model when none is
 *          named, the vector passages with `--semantic`, only rows updated since an instant with `--since`) and prints
 *          the job id (`--json`: the model, the scope and the job, absent when one already waits). A full rebuild
 *          resumes from the cursor a stopped one recorded.
 * Boundary: queues and returns through the member's `@stackra/data-maintenance/node` runner, the add-on that holds
 *           the reindex jobs (`data_maintenance.index.reindex`, `data_maintenance.index.reindex_semantic`); the
 *           member's workers run the job where its models are registered, and `stackra search:status` shows its
 *           progress. Without a scope the job is platform-wide. The CLI checks the spelling of what it can see (the
 *           scope, the instant); the job checks the model.
 * Runtime: node
 * Governing contract: ADR 0221 (decision 7: the reindex command); ADR 0404 (decision 3: run as a job); ADR 0282
 *                     (decision 3); ADR 0327 (decision 3); ADR 0506; STA-1966.
 */
import { Argument, Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { loadSearchRunner } from "#node/functions/load-search-runner.function";
import { settingsScope } from "#node/functions/settings-scope.function";

/** Queues a search reindex job. */
export class SearchReindexCommand extends Command({
  name: "search:reindex",
  description: "Queue a search reindex job (resumable), optionally partial (--since) or semantic",
  bin: true,
}) {
  /** The model; every registered model when absent. */
  @Argument({
    description: "The model to reindex (default: every model)",
    optional: true,
  })
  model?: string;

  /** The node's public id. */
  @Option({ description: "The scope node's public id, scp_<26 characters> (with --scope-path)" })
  @Str
  scopeId?: string;

  /** The node's path. */
  @Option({ description: "The scope node's ltree path, <label>.<label> (with --scope-id)" })
  @Str
  scopePath?: string;

  /** Only rows updated since this instant. */
  @Option({
    description: "Only rows updated since an ISO 8601 instant, such as 2026-10-27T00:00:00Z",
  })
  @Str
  since?: string;

  /** The vector passages instead of the text index. */
  @Option({ description: "Reindex the vector passages" })
  semantic = false;

  /** Queues the job and returns it. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    const scope =
      this.scopeId === undefined && this.scopePath === undefined
        ? undefined
        : settingsScope({ "scope-id": this.scopeId, "scope-path": this.scopePath });
    if (this.since !== undefined && Number.isNaN(Date.parse(this.since)))
      throw new CliUsageError("give --since as an ISO 8601 instant, such as 2026-10-27T00:00:00Z");
    const { job } = await (
      await loadSearchRunner(io.cwd)
    ).searchReindex({
      ...(this.model === undefined ? {} : { model: this.model }),
      ...(scope === undefined ? {} : { scope }),
      ...(this.since === undefined ? {} : { since: new Date(this.since).toISOString() }),
      ...(this.semantic ? { semantic: true } : {}),
    });
    const target = `${this.model ?? "every model"} in ${scope?.path ?? "the platform"}`;
    if (job === undefined)
      io.output.info(`search:reindex ${target}: a reindex of this scope already waits or runs`);
    else io.output.success(`search:reindex ${target}: queued ${job}`);
    return {
      ...(this.model === undefined ? {} : { model: this.model }),
      ...(scope === undefined ? {} : { scope }),
      ...(job === undefined ? {} : { job }),
    };
  }
}
