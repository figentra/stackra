/**
 * Stackra file contract:
 * Purpose: `ModelNames`, every name the feature scaffold derives from one model and its module, the way gen derives
 *          them: the class, the file stem, the snake key, the table and its schema, and the service field.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 20: model key, snake_case plural table in the module's schema; decision 13:
 *                     the module is its folder).
 */

/** The names of one model. */
export type ModelNames = {
  /** The module folder under `src/modules/` (`price-lists`). */
  readonly module: string;

  /** The module's Postgres schema, its snake_case key (`price_lists`). */
  readonly schema: string;

  /** The model's kebab-case file stem (`price-list`). */
  readonly stem: string;

  /** The class (`PriceList`). */
  readonly className: string;

  /** The snake_case model segment of keys (`price_list`). */
  readonly snake: string;

  /** The camelCase singular (`priceList`), the stem of the `<model>Id` input field. */
  readonly camel: string;

  /** The table without its schema (`price_lists`). */
  readonly table: string;

  /** The camelCase plural (`priceLists`), the action's and query's service field. */
  readonly plural: string;
};
