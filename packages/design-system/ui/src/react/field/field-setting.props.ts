/**
 * Stackra file contract:
 * Purpose: Props of `Field.Setting`.
 * Boundary: types only. Split from field.tsx so that file exports only the `Field` table and each part hot-reloads
 *           (rule-gap B-6, react/only-export-components).
 * Runtime: browser
 * Governing contract: ADR 0055 (decision 2: thin field adapters); ADR 0305 (rules 10 to 13: one declaration per
 *                     file); ADR 0311 (fields props vocabulary).
 */
import type { SettingDescriptor } from "#react/field/setting-descriptor.type";

/** Props of `Field.Setting`. */
export interface FieldSettingProps {
  /** The setting to draw. */
  readonly setting: SettingDescriptor;
  /** Where the value comes from (such as `default`, `platform`, `tenant`), shown as the description. */
  readonly provenance?: string;
}
