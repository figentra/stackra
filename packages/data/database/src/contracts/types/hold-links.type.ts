/**
 * Stackra file contract:
 * Purpose: `HoldLinks`, the subject links of the records a disposal would remove: for each record id, the public id each
 *          of its declared link fields holds (`{ ord_1: { customerId: "per_7" } }`), so a hold on a person reaches the
 *          records linked to that person.
 * Boundary: a type only, plain JSON so a `HoldChannel` sends it over a generated client as is. The fields are the ones
 *           the model declared with `registerHoldLinks`; a record whose link fields are all empty has no entry. The
 *           implementer of `HoldRegistry` decides what a link means; the data layer only reports it.
 * Runtime: isomorphic
 * Governing contract: ADR 0134 (2026-10-24 amendment: the implementer follows links); STA-1241.
 */

/** Record id to (link field to linked public id). */
export type HoldLinks = Readonly<Record<string, Readonly<Record<string, string>>>>;
