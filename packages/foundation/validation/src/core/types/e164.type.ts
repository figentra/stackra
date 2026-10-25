/**
 * Stackra file contract:
 * Purpose: `E164`, a phone number in E.164 form (`+966500000001`): a plus, a country calling code and the subscriber
 *          number, at most 15 digits, no spaces.
 * Boundary: a type only; `e164()` is its schema. The same template type as `OutboundSms.to` of
 *           `@stackra/notifications`, so a checked number flows to a transport without a cast.
 * Runtime: isomorphic
 * Governing contract: ITU-T E.164; ADR 0305.
 */

/** An E.164 number. */
export type E164 = `+${string}`;
