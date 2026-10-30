/**
 * Stackra file contract:
 * Purpose: the native `ImportMappingList`: a Select per file column (named by the column, its first value as the
 *          hint) of the fields to fill or "skip", and an alert naming the required fields still unmatched.
 * Boundary: internal: the matching step of the native `ImportFlow` and `ImportDialog`; the mapping is the caller's.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import type { ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { unmappedRequiredOf } from "#core/functions/unmapped-required-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import type { ImportMappingListProps } from "#native/import-flow/import-mapping-list.props";
import { Select } from "#native/select/select";
import { Text } from "#native/text/text";

/** The words' keys. */
const K = UI_KEYS.ui.import_flow;
/** The select's id for a skipped column. */
const SKIP = "__skip";

/** Match each column of the file to a field. */
export function ImportMappingList({
  columns,
  sample,
  fields,
  mapping,
  onChange,
}: ImportMappingListProps): ReactElement {
  const t = useUiText();
  const missing = unmappedRequiredOf(fields, mapping);
  const items = [
    { id: SKIP, label: t(K.skip) },
    ...fields.map((field) => ({
      id: field.key,
      label: field.isRequired ? `${field.label} *` : field.label,
    })),
  ];
  return (
    <>
      {columns.map((column) => (
        <Select
          key={column}
          label={column}
          {...(sample?.[column] ? { description: t(K.sample, { value: sample[column] }) } : {})}
          items={items}
          value={mapping[column] ?? SKIP}
          onChange={(key) =>
            onChange({ ...mapping, [column]: key === SKIP || key === null ? null : key })
          }
          isFullWidth
        />
      ))}
      {missing.length > 0 ? (
        <Text accessibilityRole="alert" type="small" tone="danger">
          {t(K.required_missing, { fields: missing.map((field) => field.label).join("، ") })}
        </Text>
      ) : null}
    </>
  );
}
