/**
 * Stackra file contract:
 * Purpose: `Faker`, what a factory's `definition(faker)` and a state callback receive: Faker's own API plus
 *          `publicId(prefix)`, a well-formed public id of that prefix.
 * Boundary: a type only; exported from `./testing` alone, so a runtime entry never names Faker.
 * Runtime: node
 * Governing contract: ADR 0190 (factories); ADR 0135 (public id format); ADR 0269 (helpers in `./testing`).
 */
import type { Faker as FakerJs } from "@faker-js/faker";
import type { PublicId } from "@stackra/contracts";

/** Faker with public ids. */
export type Faker = FakerJs & {
  /**
   * A random public id with `prefix`: the prefix, `_` and 26 lowercase Crockford base32 characters.
   *
   * @example
   * faker.publicId("usr"); // "usr_01jaz…"
   */
  publicId: <const P extends string>(prefix: P) => PublicId<P>;
};
