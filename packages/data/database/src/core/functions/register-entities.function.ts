/**
 * Stackra file contract:
 * Purpose: `registerEntities`, how a generated entity file (`#stackra/entities/<module>`, a service's hosted copy
 *          `#stackra/entities/hosted/<package>/<module>`, or a package's committed `#node/entities.gen`, STA-1874) hands
 *          its `EntitySchema`s to the database, so a driver and `usePostgres()` connect with every module's entities
 *          without a list.
 * Boundary: called by generated code. One schema per table: a schema whose schema-qualified table is already registered
 *           is skipped, so a service that hosts a package's models and also imports that package's own list registers
 *           each table once, the first registration winning (STA-2116; MikroORM refuses a duplicate table name).
 * Runtime: node
 * Governing contract: ADR 0097 (decision 3: gen emits EntitySchema; decision 5.4: no runtime scan).
 */
import type { EntitySchema } from "@mikro-orm/core";

import { REGISTERED_ENTITIES } from "#core/constants/registered-entities.constant";

/** The schema-qualified table a schema maps, or its entity name when it names no table. */
function tableOf(entity: EntitySchema): string {
  return `${entity.meta.schema ?? ""}.${entity.tableName ?? String(entity.name)}`;
}

/**
 * Registers entity schemas, one per table.
 *
 * @example
 * export const entities = [OrderSchema, OrderLineSchema] as const;
 * registerEntities(entities);
 */
export function registerEntities(entities: readonly EntitySchema[]): void {
  const tables = new Set([...REGISTERED_ENTITIES].map(tableOf));
  for (const entity of entities) {
    const table = tableOf(entity);
    if (REGISTERED_ENTITIES.has(entity) || tables.has(table)) continue;
    REGISTERED_ENTITIES.add(entity);
    tables.add(table);
  }
}
