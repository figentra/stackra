/**
 * Stackra file contract:
 * Purpose: `isSettingValue`, whether a value fits one setting key: its type, its nullability and its bounds. The
 *          reader checks a page write with it and the form checks typed input with it before writing.
 * Boundary: pure; it checks one key's own metadata, never a cross-field rule (those are the class schema's). A
 *           connection key takes a `conn_` public id, never a credential. Internal: not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 22 and 23).
 */
import type { SettingValue } from "#contracts/index";
import { SettingType } from "#core/enums/setting-type.enum";
import type { SettingKeyInput } from "#core/types/setting-key-input.type";

/**
 * Whether `value` is a valid value of `key`.
 *
 * @example
 * isSettingValue({ type: SettingType.Integer, min: 5, max: 1440, ... }, 30); // true
 */
export function isSettingValue(key: SettingKeyInput, value: unknown): value is SettingValue {
  if (value === null) return key.nullable === true;
  if (key.type === SettingType.Boolean) return typeof value === "boolean";
  if (key.type === SettingType.String) return typeof value === "string";
  if (key.type === SettingType.Connection)
    return typeof value === "string" && value.startsWith("conn_");
  if (typeof value !== "number" || !Number.isFinite(value)) return false;
  if (key.type === SettingType.Integer && !Number.isInteger(value)) return false;
  return (key.min === undefined || value >= key.min) && (key.max === undefined || value <= key.max);
}
