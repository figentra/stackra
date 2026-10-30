/**
 * Stackra file contract:
 * Purpose: the web `ImportMappingList`: one row per file column (its name and first value) with a Select of the fields
 *          to fill or "skip", and an alert naming the required fields still unmatched.
 * Boundary: internal: the matching step of `ImportFlow` and `ImportDialog`; the mapping is the caller's state.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.3.1 and 3.3.1; STA-1371.
 */
import type { ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { unmappedRequiredOf } from "#core/functions/unmapped-required-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import type { ImportMappingListProps } from "#react/import-flow/import-mapping-list.props";
import { Select } from "#react/select/select";

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
      <ul className="@container m-0 flex list-none flex-col divide-y divide-separator rounded-lg border border-separator p-0">
        {columns.map((column) => (
          <li key={column} className="grid grid-cols-1 items-center gap-2 px-3 py-2 @md:grid-cols-2">
            <div className="flex min-w-0 flex-col">
              <bdi className="truncate text-sm font-medium">{column}</bdi>
              {sample?.[column] ? (
                <span className="truncate text-xs text-muted">
                  {t(K.sample, { value: sample[column] })}
                </span>
              ) : null}
            </div>
            <Select
              aria-label={`${t(K.field)}: ${column}`}
              items={items}
              value={mapping[column] ?? SKIP}
              onChange={(key) =>
                onChange({ ...mapping, [column]: key === SKIP || key === null ? null : key })
              }
              isFullWidth
            />
          </li>
        ))}
      </ul>
      {missing.length > 0 ? (
        <p role="alert" className="m-0 text-sm text-danger">
          {t(K.required_missing, { fields: missing.map((field) => field.label).join("، ") })}
        </p>
      ) : null}
    </>
  );
}
