/**
 * Stackra file contract:
 * Purpose: `TableInput`, the closed input of a resource table's list query: `cursor`, `limit` (20, 50 or 100), `sort`
 *          and `filter`.
 * Boundary: a plain shape class: gen narrows a subclass's `sort` to the sortable keys and its `filter` to the filters
 *           of the resource table bound to the query, and `database` applies it later (ADR 0307 rule 2). It registers
 *           this package's own unnarrowed schema for itself when the module loads.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0307 (resource tables); the HTTP conventions (cursor pagination).
 */
import type { SortDirection } from "@stackra/contracts";

import { Schema } from "#core/bases/schema.base";
import { TABLE_INPUT_SCHEMA } from "#core/constants/table-input-schema.constant";
import { registerSchemas } from "#core/functions/register-schemas.function";

/**
 * The cursor, page size, sort and filters of a resource table's list query.
 *
 * @example
 * export class ListOrdersInput extends TableInput {}
 */
export class TableInput extends Schema {
  /** The opaque cursor of the page to read; absent for the first page. */
  cursor?: string;

  /** How many rows to return: one of the table's page sizes. */
  limit: 20 | 50 | 100 = 20;

  /** The sort key and direction; absent means the table's default sort. */
  sort?: { key: string; direction: SortDirection };

  /** The filter values by filter key; empty means no filter. */
  filter: Record<string, unknown> = {};
}

registerSchemas([[TableInput, TABLE_INPUT_SCHEMA]]);
