/**
 * Stackra file contract:
 * Purpose: `Aggregate`, how a saved view totals a column per group: `@stackra/database`'s enum (`count`, `sum`, `avg`,
 *          `min`, `max`, `distinct`), re-exported so a view's totals, the metrics reader and the report vocabulary share
 *          one set of codes.
 * Boundary: a re-export; the panel's own enum (with `average`) is gone (ADR 0470 consequences: the two `Aggregate`
 *           enums merge into the database one, extended). A saved view's `totals` are served by the server group-by;
 *           `groupRows` applies them only to a fully loaded relation table.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decision 4 and consequences); ADR 0359 (decision 14); ADR 0294 (decision 16: Enum).
 */
export { Aggregate } from "@stackra/database";
