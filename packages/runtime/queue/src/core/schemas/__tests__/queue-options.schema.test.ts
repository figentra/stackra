/**
 * Stackra file contract:
 * Purpose: unit tests of `QueueOptions` and its shipped schema: a shape registered with `QUEUE_CONFIG_SCHEMA`, whose
 *          initializer equals the schema's default and whose `driver` is typed as the `QueueDriver` driver names.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 19 and 26).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { Schema, schemaOf } from "@stackra/validation";

import { QUEUE_CONFIG_SCHEMA } from "#core/constants/queue-config-schema.constant";
import { QueueOptions } from "#core/schemas/queue-options.schema";

describe("QueueOptions", () => {
  it("is a shape registered with the shipped schema", () => {
    expect(new QueueOptions()).toBeInstanceOf(Schema);
    expect(schemaOf(QueueOptions)).toBe(QUEUE_CONFIG_SCHEMA);
  });

  it("has an initializer equal to the shipped default", () => {
    expect({ ...new QueueOptions() }).toEqual(QUEUE_CONFIG_SCHEMA.parse({}));
    expect(QUEUE_CONFIG_SCHEMA.parse({})).toEqual({
      driver: "postgres",
      health: { timeout: "PT2S", critical: true },
    });
  });

  it("types driver as the QueueDriver driver names", () => {
    expectTypeOf<QueueOptions["driver"]>().toEqualTypeOf<"postgres" | "memory" | "broker">();
  });
});
