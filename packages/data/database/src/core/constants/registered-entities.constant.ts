/**
 * Stackra file contract:
 * Purpose: `REGISTERED_ENTITIES`, the generated `EntitySchema`s the process registered, which a driver connects with
 *          when it is given none.
 * Boundary: internal; filled only by `registerEntities`. Insertion order is kept, so the ORM sees modules in the order
 *           gen's entity files load.
 * Runtime: node
 * Governing contract: ADR 0097 (decisions 3 and 5.4: the schema registry is the gen output, not a runtime scan).
 */
import type { EntitySchema } from "@mikro-orm/core";

/** Every registered entity schema. */
export const REGISTERED_ENTITIES = new Set<EntitySchema>();
