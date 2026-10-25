/**
 * Stackra file contract:
 * Purpose: unit tests of `instantiate`: parsed data becomes an instance of the class without running its constructor,
 *          so no initializer resets a parsed value.
 * Boundary: test only; imports the internal subject through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 25 and
 *                     27).
 */
import { describe, expect, it } from "@stackra/testing";

import { Schema } from "#core/bases/schema.base";
import { instantiate } from "#core/functions/instantiate.function";

let constructed = 0;

class Counter extends Schema {
  count = 0;

  label!: string;

  constructor() {
    super();
    constructed += 1;
  }
}

describe("instantiate", () => {
  it("puts the data on an instance of the class without running its constructor", () => {
    const value = instantiate(Counter, { count: 3, label: "x" });
    expect(value).toBeInstanceOf(Counter);
    expect(value).toEqual({ count: 3, label: "x" });
    expect(Object.keys(value)).toEqual(["count", "label"]);
    expect(constructed).toBe(0);
  });
});
