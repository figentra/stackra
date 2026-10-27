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
import { Field } from "#core/decorators/field.decorator";
import { registerSchemas } from "#core/functions/register-schemas.function";

/**
 * The cursor, page size, sort and filters of a resource table's list query.
 *
 * @example
 * export class ListOrdersInput extends TableInput {}
 */
export class TableInput extends Schema {
  /** How many rows to return: one of the table's page sizes. */
  // reason: a closed set of page sizes, which no typed decorator says; the shipped schema already states its rule
  @Field(TABLE_INPUT_SCHEMA.shape.limit)
  limit: 20 | 50 | 100 = 20;

  /** The sort key and direction; absent means the table's default sort. */
  // reason: gen narrows it to the sortable keys of the bound resource table; the shipped schema already states its rule
  @Field(TABLE_INPUT_SCHEMA.shape.sort)
  sort?: { key: string; direction: SortDirection };

  /** The filter values by filter key; empty means no filter. */
  // reason: gen narrows it to the filters of the bound resource table; the shipped schema already states its rule
  @Field(TABLE_INPUT_SCHEMA.shape.filter)
  filter: Record<string, unknown> = {};

  /** The opaque cursor of the page to read; absent for the first page. */
  cursor?: string;
}

registerSchemas([[TableInput, TABLE_INPUT_SCHEMA]]);
