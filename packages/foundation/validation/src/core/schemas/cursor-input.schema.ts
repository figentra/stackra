/**
 * Stackra file contract:
 * Purpose: `CursorInput`, the base of a list query's input: an opaque `cursor` from the previous page and a `limit`
 *          from 1 to 100 (20 by default).
 * Boundary: a shape class; it registers this package's own schema for itself when the module loads, so
 *           `validate(CursorInput, raw)` works with no generated file. A subclass gets its own schema from gen, which
 *           inlines these two fields.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 26); the HTTP conventions (cursor pagination).
 */
import { Schema } from "#core/bases/schema.base";
import { CURSOR_INPUT_SCHEMA } from "#core/constants/cursor-input-schema.constant";
import { Int } from "#core/decorators/int.decorator";
import { registerSchemas } from "#core/functions/register-schemas.function";

/**
 * The cursor and page size of a list query.
 *
 * @example
 * export class ListStorefrontProductsInput extends CursorInput {
 *   search?: string;
 * }
 */
export class CursorInput extends Schema {
  /** How many items to return. */
  @Int({
    min: 1,
    max: 100,
  })
  limit = 20;

  /** The opaque cursor of the page to read; absent for the first page. */
  cursor?: string;
}

registerSchemas([[CursorInput, CURSOR_INPUT_SCHEMA]]);
