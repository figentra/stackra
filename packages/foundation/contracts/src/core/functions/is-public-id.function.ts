/**
 * Stackra file contract:
 * Purpose: `isPublicId(value, prefix)`, whether a string is a public id with `prefix`: the prefix, `_`, and 26
 *          Crockford base32 characters, the form `mintPublicId` makes (ADR 0135 decision 1), in either case.
 * Boundary: pure; a type guard for values that arrive as plain strings (a header, a claim) before they are trusted as
 *           `PublicId<P>`. It checks the form only, never that the id exists.
 * Runtime: isomorphic
 * Governing contract: ADR 0135 (decisions 1 and 2: format and prefixes).
 */
import type { PublicId } from "#core/types/public-id.type";

/**
 * Whether `value` is a public id with `prefix`.
 *
 * @param value - anything; only a string can pass.
 * @param prefix - the registered prefix, 2 to 6 lowercase letters (`"scp"`, `"ord"`).
 * @example
 * isPublicId("scp_01j9z3k4m5n6p7q8r9s0t1v2wa", "scp"); // true
 * isPublicId("scope-1", "scp"); // false
 */
export function isPublicId<const P extends string>(
  value: unknown,
  prefix: P,
): value is PublicId<P> {
  return (
    typeof value === "string" &&
    /^[a-z]{2,6}$/.test(prefix) &&
    value.length === prefix.length + 27 &&
    value.startsWith(`${prefix}_`) &&
    /^[0-9a-hjkmnp-tv-z]{26}$/i.test(value.slice(prefix.length + 1))
  );
}
