/**
 * Stackra file contract:
 * Purpose: `SearchStatusCommand`, `stackra search:status`: shows every index of the member's registry as a table:
 *          model, scope, state, document count, the resume cursor of a rebuild in progress and the last rebuild
 *          (`--json`: the indexes as the registry gives them).
 * Boundary: reads only, through the member's own `@stackra/search/node`; the registry holds states and counts, never
 *           row data.
 * Runtime: node
 * Governing contract: ADR 0404 (decision 3); ADR 0221 (decision 7); ADR 0282 (decision 3); ADR 0506; STA-1966.
 */
import { Command, type CommandIo } from "@stackra/console";

import { loadSearchRunner } from "#node/functions/load-search-runner.function";

/** Shows each search index's state. */
export class SearchStatusCommand extends Command({
  name: "search:status",
  description: "Show each search index's state, document count and rebuild progress",
  bin: true,
}) {
  /** Draws the indexes and returns them. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    const indexes = await (await loadSearchRunner(io.cwd)).searchStatus();
    io.output.table({
      title: `search:status: ${indexes.length} index${indexes.length === 1 ? "" : "es"}`,
      columns: [
        { header: "Model", key: "model" },
        { header: "Scope", key: "scope" },
        { header: "State", key: "state" },
        { header: "Documents", key: "docCount", kind: "count" },
        { header: "Resumes after", key: "cursor" },
        { header: "Rebuilt", key: "rebuiltAt" },
      ],
      rows: indexes.map((index) => ({
        model: index.model,
        scope: index.scope?.path ?? "platform",
        state: index.state,
        docCount: index.docCount,
        cursor: index.cursor ?? "",
        rebuiltAt: index.rebuiltAt?.toISOString() ?? "",
      })),
    });
    return { indexes };
  }
}
