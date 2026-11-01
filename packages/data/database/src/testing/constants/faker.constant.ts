/**
 * Stackra file contract:
 * Purpose: `FAKER`, the one Faker every factory definition receives: Faker's English instance with `publicId(prefix)`.
 * Boundary: internal to `./testing`. It inherits from Faker's instance, so `faker.seed(n)` on that instance makes the
 *           factories repeatable. `FAKER` is a lazy proxy: `@faker-js/faker` is an optional peer, so it loads on the
 *           first property read (through `requireTestPeer`), never when `./testing` is imported. A proxy keeps the
 *           synchronous `FAKER` object and its `Faker` type that `Factory.make` and every `definition(faker)` already
 *           use; the alternatives (an async preload, a `getFaker()` call) would change `make` or every caller.
 * Runtime: node
 * Governing contract: ADR 0190 (factories); ADR 0135 (public ids); STA-1812.
 */
import type * as FakerModule from "@faker-js/faker";

import { requireTestPeer } from "#testing/functions/require-test-peer.function";
import type { Faker } from "#testing/types/faker.type";

/** The 32 characters of lowercase Crockford base32. */
const CROCKFORD = "0123456789abcdefghjkmnpqrstvwxyz";

/** A registered prefix: 2 to 6 lowercase letters. */
const PREFIX = /^[a-z]{2,6}$/;

/** The real Faker with public ids, made on first use. */
let real: Faker | undefined;

/** Loads Faker once and adds `publicId`. */
function resolve(): Faker {
  real ??= Object.assign(
    Object.create(requireTestPeer<typeof FakerModule>("@faker-js/faker").faker) as Faker,
    {
      publicId<const P extends string>(this: Faker, prefix: P): `${P}_${string}` {
        if (!PREFIX.test(prefix))
          throw new TypeError(`"${prefix}" is not a public id prefix: 2 to 6 lowercase letters`);
        return `${prefix}_${this.string.fromCharacters(CROCKFORD, 26)}`;
      },
    },
  );
  return real;
}

/** Forwards a read to the real Faker; functions are bound to it so `this` is never the proxy. */
function read(_target: object, key: string | symbol): unknown {
  const value: unknown = Reflect.get(resolve(), key);
  return typeof value === "function"
    ? (value as (...args: never[]) => unknown).bind(resolve())
    : value;
}

/** Faker with public ids. */
export const FAKER: Faker = new Proxy({} as Faker, {
  get: read,
  has: (_target, key) => key in resolve(),
});
