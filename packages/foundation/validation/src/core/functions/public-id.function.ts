/**
 * Stackra file contract:
 * Purpose: `publicId(prefix)`, the schema generated code writes for a field typed `PublicId<"ord">`: the prefix, an
 *          underscore and 26 Crockford base32 characters, with the output typed `PublicId<"ord">` so `X$Check` holds.
 * Boundary: checks the format only; whether the record exists is the handler's question. Crockford base32 reads both
 *           cases, so an id in upper case passes and is kept as given. The prefix is checked when the schema is built,
 *           so a typo fails on import, not on the first request. Authored code never calls it.
 * Runtime: isomorphic
 * Governing contract: ADR 0135 (public id format); ADR 0294 (decision 26); ADR 0231 (prefix casing).
 */
import type { PublicId } from "@stackra/contracts";
import { z } from "zod";
import type { ZodType } from "zod";

/** A registered prefix: 2 to 6 lowercase letters. */
const PREFIX = /^[a-z]{2,6}$/;

/**
 * A new schema of public ids with `prefix`.
 *
 * @param prefix - the model's registered prefix (`"ord"`, `"usr"`).
 * @throws TypeError when `prefix` is not 2 to 6 lowercase letters.
 * @example
 * export const GetOrderInput$ = z.object({ orderId: publicId("ord") });
 */
export function publicId<const P extends string>(prefix: P): ZodType<PublicId<P>, string> {
  if (!PREFIX.test(prefix))
    throw new TypeError(`"${prefix}" is not a public id prefix: 2 to 6 lowercase letters`);
  return z
    .string()
    .regex(
      new RegExp(`^${prefix}_[0-9a-hjkmnp-tv-z]{26}$`, "i"),
      `Expected a public id "${prefix}_" followed by 26 Crockford base32 characters`,
    ) as unknown as ZodType<PublicId<P>, string>;
}
