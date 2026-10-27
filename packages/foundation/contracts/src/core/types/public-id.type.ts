/**
 * Stackra file contract:
 * Purpose: `PublicId<P>`: the only external form of a record's id, `<prefix>_<26 lowercase Crockford base32
 *          characters of its UUIDv7>`.
 * Boundary: a type only. It checks the prefix at compile time; the 26-character body is checked by the generated
 *           schema at the edge. Every id (model ids via `HasPublicId`, `evt_` event ids of actions, outbox and events)
 *           is minted by `mintPublicId` (STA-1380), never here.
 * Runtime: isomorphic
 * Governing contract: ADR 0135 (format), ADR 0082 (database ids never leave a service), ADR 0231 (prefix casing).
 */

/**
 * A public id with the prefix `P` (2 to 6 lowercase letters, registered once in the manifest). Without `P` it is a
 * public id of any prefix.
 *
 * @example
 * customerId!: PublicId<"usr">;
 * const order: PublicId<"ord"> = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3"; // type error: wrong prefix
 */
export type PublicId<P extends string = string> = `${P}_${string}`;
