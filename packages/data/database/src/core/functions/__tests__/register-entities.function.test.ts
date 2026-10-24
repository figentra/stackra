/**
 * Stackra file contract:
 * Purpose: unit tests of `registerEntities`: generated schemas are kept once each, in registration order.
 * Boundary: test only; reads the internal registry.
 * Runtime: node (vitest)
 * Governing contract: ADR 0097 (decisions 3 and 5.4); ADR 0022; ADR 0269.
 */
import { EntitySchema } from "@mikro-orm/core";
import { describe, expect, it } from "@stackra/testing";

import { REGISTERED_ENTITIES } from "#core/constants/registered-entities.constant";
import { registerEntities } from "#core/functions/register-entities.function";

describe(registerEntities, () => {
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
    expect(
      [...REGISTERED_ENTITIES].filter((schema) => schema === first || schema === second),
    ).toEqual([first, second]);
  });
});
