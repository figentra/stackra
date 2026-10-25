/**
 * Stackra file contract:
 * Purpose: `SettingValue`, the value one setting holds: a boolean, a number, a string (a connection's public id
 *          included) or `null` for a nullable key.
 * Boundary: a type only. A setting is never a secret (ADR 0307 rule 23): a credential is a connection, and a setting
 *           holds at most its id. A section is a group of settings, never one value.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 22 and 23); ADR 0108 (decision 4).
 */

/**
 * One stored setting value.
 *
 * @example
 * const values: Record<string, SettingValue> = { acceptingOrders: true, "cancellation.autoCancelAfterMinutes": 45 };
 */
export type SettingValue = boolean | number | string | null;
