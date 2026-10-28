/**
 * Stackra file contract:
 * Purpose: unit tests of `OutboxOptions`: a schema class registered with the shipped schema, whose initializer equals
 *          the schema's default and whose `driver` is typed by the driver-name registry.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 26).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { Schema, schemaOf } from "@stackra/validation";

import { OUTBOX_CONFIG_SCHEMA } from "#core/constants/outbox-config-schema.constant";
import { OutboxOptions } from "#core/schemas/outbox-options.schema";

describe("OutboxOptions", () => {
  it("is a shape registered with the shipped schema", () => {
    expect(new OutboxOptions()).toBeInstanceOf(Schema);
    expect(schemaOf(OutboxOptions)).toBe(OUTBOX_CONFIG_SCHEMA);
  });

  it("has an initializer equal to the shipped default", () => {
    expect({ ...new OutboxOptions() }).toEqual(OUTBOX_CONFIG_SCHEMA.parse({}));
    expect(OUTBOX_CONFIG_SCHEMA.parse({})).toEqual({
      driver: "postgres",
      batchWindowSeconds: 0,
      changeRetentionDays: 7,
      pruneAfterDays: 30,
    });
  });

  it("types driver as the OutboxDriver driver names", () => {
    expectTypeOf<OutboxOptions["driver"]>().toEqualTypeOf<"postgres" | "memory">();
  });
});
