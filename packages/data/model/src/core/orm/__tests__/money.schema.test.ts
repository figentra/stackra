/**
 * Stackra file contract:
 * Purpose: unit tests of `MoneySchema`: an embeddable of the `Money` class from @stackra/money, so gen's entity
 *          metadata can embed it with a prefix.
 * Boundary: test only; reads the schema's metadata without an ORM or a connection.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 27); ADR 0220.
 */
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { MoneySchema } from "#core/orm/money.schema";

describe("MoneySchema", () => {
  it("is the Money embeddable", () => {
    expect(MoneySchema.meta.class).toBe(Money);
    expect(MoneySchema.meta.embeddable).toBe(true);
    expect(MoneySchema.name).toBe("Money");
  });
});
