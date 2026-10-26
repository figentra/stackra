/**
 * Stackra file contract:
 * Purpose: `FIELD_KEY`, the one casing of a fact source, field, outcome kind and parameter key: camelCase, 1 to 63
 *          characters (`channelId`, never `channel_id`). A condition path is two of them joined by a dot
 *          (`record.channelId`).
 * Boundary: a constant only. `Rules.create`, `FactSource$` and every registry of condition fields (the
 *           `ConditionFieldService` of `./node`, IAM's dimension rows) test keys with this one pattern, so a field a
 *           model names in TypeScript is the field a stored condition names, in every service.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 2 and 4); ADR 0231 (codes are snake_case, keys of TypeScript attributes
 *                     are camelCase); STA-817 and STA-1250 (one key casing across services).
 */

/**
 * A camelCase key of 1 to 63 characters.
 *
 * @example
 * FIELD_KEY.test("channelId"); // true
 * FIELD_KEY.test("channel_id"); // false
 */
export const FIELD_KEY = /^[a-z][a-zA-Z0-9]{0,62}$/;
