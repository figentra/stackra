/**
 * Stackra file contract:
 * Purpose: `FAKER`, the one Faker every factory definition receives: Faker's English instance with `publicId(prefix)`.
 * Boundary: internal to `./testing`. It inherits from Faker's instance, so `faker.seed(n)` on that instance makes the
 *           factories repeatable.
 * Runtime: node
 * Governing contract: ADR 0190 (factories); ADR 0135 (public ids).
 */
import { faker } from "@faker-js/faker";

import type { Faker } from "#testing/types/faker.type";

/** The 32 characters of lowercase Crockford base32. */
const CROCKFORD = "0123456789abcdefghjkmnpqrstvwxyz";

/** A registered prefix: 2 to 6 lowercase letters. */
const PREFIX = /^[a-z]{2,6}$/;

/** Faker with public ids. */
export const FAKER: Faker = Object.assign(Object.create(faker) as Faker, {
  publicId<const P extends string>(prefix: P): `${P}_${string}` {
    if (!PREFIX.test(prefix))
      throw new TypeError(`"${prefix}" is not a public id prefix: 2 to 6 lowercase letters`);
    return `${prefix}_${faker.string.fromCharacters(CROCKFORD, 26)}`;
  },
});
