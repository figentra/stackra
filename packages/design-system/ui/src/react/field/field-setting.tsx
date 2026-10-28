/**
 * Stackra file contract:
 * Purpose: A setting bound by `setting.path`, drawn by its kind with its provenance as the description.
 * Boundary: reached as a `Field` part; thin over the bound field (see field.tsx).
 *           Split from field.tsx so that file exports only the `Field` table and each part hot-reloads (rule-gap
 *           B-6, react/only-export-components).
 * Runtime: browser
 * Governing contract: ADR 0055 (decision 2: thin field adapters); ADR 0305 (rules 10 to 13: one declaration per
 *                     file); ADR 0311 (fields props vocabulary).
 */
import type { ReactElement } from "react";
import type { FieldSettingProps } from "#react/field/field-setting.props";
import { FieldText } from "#react/field/field-text";
import { FieldNumber } from "#react/field/field-number";
import { FieldSwitch } from "#react/field/field-switch";
import { FieldSelect } from "#react/field/field-select";

/** A setting bound by `setting.path`, drawn by its kind with its provenance as the description. */
export function FieldSetting({ setting, provenance }: FieldSettingProps): ReactElement {
  const { path, label, kind, min, max, options } = setting;
  const common = { name: path, label, description: provenance };
  if (kind === "boolean") return <FieldSwitch {...common} />;
  if (kind === "number") return <FieldNumber {...common} minValue={min} maxValue={max} />;
  if (kind === "select") return <FieldSelect {...common} options={options ?? []} />;
  return <FieldText {...common} />;
}
