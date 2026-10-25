/**
 * Stackra file contract:
 * Purpose: `registerEntities`, how a generated entity file (`#stackra/entities/<module>`) hands its `EntitySchema`s to
 *          the database, so a driver and `usePostgres()` connect with every module's entities without a list.
 * Boundary: called by generated code; adding the same schema twice keeps one.
 * Runtime: node
 * Governing contract: ADR 0097 (decision 3: gen emits EntitySchema; decision 5.4: no runtime scan).
 */
import type { EntitySchema } from "@mikro-orm/core";

import { REGISTERED_ENTITIES } from "#core/constants/registered-entities.constant";

/**
 * Registers entity schemas.
 *
 * @example
 * export const entities = [OrderSchema, OrderLineSchema] as const;
 * registerEntities(entities);
 */
export function registerEntities(entities: readonly EntitySchema[]): void {
  for (const entity of entities) REGISTERED_ENTITIES.add(entity);
}
