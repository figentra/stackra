/**
 * Stackra file contract:
 * Purpose: `ENCORE_TOOL_NOTES`, the note `stackra mcp` puts before the description of a proxied Encore tool, by the
 *          tool's Encore name. Encore's `query_database` runs with no tenant set, so a table under row-level security
 *          answers no rows there; its note sends an agent to `db_query` instead of turning row-level security off.
 * Boundary: data only; `serveLocalMcp` applies it in `tools/list`. The proxied call itself is forwarded unchanged.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: local mode); ADR 0334 rule 8 (`stackra mcp` is the one Encore path).
 */

/** The note before a proxied Encore tool's own description, by the tool's Encore name. */
export const ENCORE_TOOL_NOTES: ReadonlyMap<string, string> = new Map([
  [
    "query_database",
    "Runs with no tenant set: a table under row-level security answers no rows here, which does not mean the rows " +
      "are missing. Query tenant tables with `db_query` and the tenant's scope id; never turn row-level security off " +
      "to see rows. ",
  ],
]);
