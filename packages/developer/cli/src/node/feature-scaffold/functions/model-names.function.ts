/**
 * Stackra file contract:
 * Purpose: `modelNames(module, model)`, the names of a model in a module: its class, file stem, key segment, table and
 *          schema, and the camelCase singular and plural the action and query scaffolds use.
 * Boundary: pure. The table comes from gen's own `tableName`, so a scaffolded migration creates the table the model
 *           maps to.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 13 and 20); ADR 0231 (naming and casing).
 */
import { tableName } from "@stackra/gen";
import { camelCase, kebabCase, pascalCase, snakeCase } from "@stackra/support";

import type { ModelNames } from "#node/feature-scaffold/types/model-names.type";

/**
 * The names of `model` in `module`.
 *
 * @param module - the module folder (`price-lists`).
 * @param model - the model name in kebab-case or PascalCase (`price-list`, `PriceList`).
 * @example
 * modelNames("price-lists", "price-list").table; // "price_lists"
 */
export function modelNames(module: string, model: string): ModelNames {
  const className = pascalCase(model);
  const schema = snakeCase(module);
  const table = tableName(schema, className).slice(schema.length + 1);
  return {
    module,
    schema,
    stem: kebabCase(className),
    className,
    snake: snakeCase(className),
    camel: camelCase(className),
    table,
    plural: camelCase(table),
  };
}
