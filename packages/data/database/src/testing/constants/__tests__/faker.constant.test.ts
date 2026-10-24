/**
 * Stackra file contract:
 * Purpose: unit tests of `FAKER`: Faker's API is there, and `publicId(prefix)` gives a well-formed public id and
 *          refuses a bad prefix.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0190; ADR 0135; ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { FAKER } from "#testing/constants/faker.constant";

describe("FAKER", () => {
  it("adds publicId to Faker", () => {
    expect(FAKER.publicId("usr")).toMatch(/^usr_[0-9a-hjkmnp-tv-z]{26}$/);
    expect(FAKER.publicId("usr")).not.toBe(FAKER.publicId("usr"));
    expect(typeof FAKER.string.uuid()).toBe("string");
    expect(() => FAKER.publicId("USR")).toThrow(TypeError);
  });
});
