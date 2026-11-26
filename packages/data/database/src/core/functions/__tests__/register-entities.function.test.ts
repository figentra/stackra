/**
 * Stackra file contract:
 * Purpose: unit tests of `registerEntities`: generated schemas are kept once each, in registration order, and one
 *          schema per schema-qualified table.
 * Boundary: test only; reads the internal registry.
 * Runtime: node (vitest)
 * Governing contract: ADR 0097 (decisions 3 and 5.4); ADR 0022; ADR 0269.
 */
import { EntitySchema } from "@mikro-orm/core";
import { describe, expect, it } from "@stackra/testing";

import { REGISTERED_ENTITIES } from "#core/constants/registered-entities.constant";
import { registerEntities } from "#core/functions/register-entities.function";

/** The registered schemas among `schemas`, in registry order. */
function registeredOf(...schemas: EntitySchema[]): EntitySchema[] {
  return [...REGISTERED_ENTITIES].filter((schema) => schemas.includes(schema));
}

/** `registerEntities` keeps one schema per table, whoever registers it. */
describe(registerEntities, () => {
  /** The same schema twice is one registration. */
  it("keeps each schema once, in order", () => {
    const first = new EntitySchema({
      name: "First",
      properties: { id: { type: "string", primary: true } },
    });
    const second = new EntitySchema({
      name: "Second",
      properties: { id: { type: "string", primary: true } },
    });
    registerEntities([first, second]);
    registerEntities([first]);
    expect(registeredOf(first, second)).toEqual([first, second]);
  });

  /** A host's hosted copy and the package's own list both describe the table; the first one registered stays. */
  it("keeps the first of two schemas for one schema-qualified table", () => {
    const hosted = new EntitySchema({
      name: "HostedBinding",
      schema: "tenancy_test",
      tableName: "approval_bindings",
      properties: { id: { type: "string", primary: true } },
    });
    const own = new EntitySchema({
      name: "OwnBinding",
      schema: "tenancy_test",
      tableName: "approval_bindings",
      properties: { id: { type: "string", primary: true } },
    });
    registerEntities([hosted]);
    registerEntities([own]);
    expect(registeredOf(hosted, own)).toEqual([hosted]);
  });

  /** The same table name in two Postgres schemas is two tables. */
  it("keeps one table name in two schemas apart", () => {
    const orders = new EntitySchema({
      name: "OrdersNote",
      schema: "orders_test",
      tableName: "notes",
      properties: { id: { type: "string", primary: true } },
    });
    const billing = new EntitySchema({
      name: "BillingNote",
      schema: "billing_test",
      tableName: "notes",
      properties: { id: { type: "string", primary: true } },
    });
    registerEntities([orders, billing]);
    expect(registeredOf(orders, billing)).toEqual([orders, billing]);
  });
});
