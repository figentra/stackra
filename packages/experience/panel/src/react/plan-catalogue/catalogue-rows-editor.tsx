/**
 * Stackra file contract:
 * Purpose: `CatalogueRowsEditor`, the rows of one plan-catalogue record as fields, for every record kind alike: each
 *          row a group of fields named by its data keys, a text as a text field, a number as a number field, a yes or
 *          no as a switch, `null` (unlimited) as an "Unlimited" switch, a list of texts as comma-separated text, and a
 *          map (seats per kind, limits) as one field per entry; a row is added by copying the last and can be removed.
 * Boundary: web; edits data only. Tiers, seat kinds, modules, trials, price lists, offers, fee schedules and rate cards
 *           are all rows, so one editor serves them and no kind is named here (configuration, not code). A list of
 *           objects is shown as JSON and kept as it is. The kind's reader checks the result before a proposal.
 * Runtime: browser
 * Governing contract: ADR 0391 (decision 2); config-model section 2; WCAG 2.2 SC 1.3.1 and 3.3.2.
 */
import type { CatalogueRow, Json } from "@stackra/contracts";
import { useTranslation } from "@stackra/i18n/react";
import { Button, Card, NumberField, Switch, Text, TextField } from "@stackra/ui/react";
import type { ReactElement, ReactNode } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import type { CatalogueRowsEditorProps } from "#react/plan-catalogue/catalogue-rows-editor.props";

/** Whether `value` is a list of texts. */
const isTextList = (value: Json): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

/** Whether `value` is a map (a JSON object). */
const isMap = (value: Json): value is { [key: string]: Json } =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * The rows of a record as fields.
 *
 * @example
 * <CatalogueRowsEditor rows={draft} onChange={setDraft} />
 */
export function CatalogueRowsEditor({
  rows,
  onChange,
  isReadOnly = false,
}: CatalogueRowsEditorProps): ReactElement {
  const { t } = useTranslation();
  const keys = PANEL_KEYS.panel.plan_catalogue;
  const report = (next: readonly CatalogueRow[]): void => onChange?.(next);

  /** The field of one value at `label`, reporting its replacement through `set`. */
  const fieldOf = (label: string, value: Json, set: (next: Json) => void): ReactNode => {
    if (typeof value === "string")
      return (
        <TextField key={label} label={label} value={value} onChange={set} isReadOnly={isReadOnly} />
      );
    if (typeof value === "number")
      return (
        <NumberField
          key={label}
          label={label}
          value={value}
          onChange={(next) => set(next ?? 0)}
          isReadOnly={isReadOnly}
        />
      );
    if (typeof value === "boolean")
      return (
        <Switch key={label} label={label} value={value} onChange={set} isReadOnly={isReadOnly} />
      );
    if (value === null)
      return (
        <Switch
          key={label}
          label={`${label}: ${t(keys.unlimited)}`}
          value
          onChange={(isUnlimited) => set(isUnlimited ? null : 0)}
          isReadOnly={isReadOnly}
        />
      );
    if (isTextList(value))
      return (
        <TextField
          key={label}
          label={label}
          value={value.join(", ")}
          onChange={(text) =>
            set(
              text
                .split(",")
                .map((item) => item.trim())
                .filter((item) => item !== ""),
            )
          }
          isReadOnly={isReadOnly}
        />
      );
    if (isMap(value))
      return (
        <fieldset
          key={label}
          className="flex flex-col gap-2 rounded-md border border-separator p-2"
        >
          <legend className="px-1 text-sm font-medium">{label}</legend>
          {Object.entries(value).map(([entry, held]) =>
            fieldOf(`${label}.${entry}`, held, (next) => set({ ...value, [entry]: next })),
          )}
        </fieldset>
      );
    return (
      <div key={label} className="flex flex-col gap-1">
        <Text type="small" className="font-medium">
          {label}
        </Text>
        <Text type="small" className="font-mono">
          {JSON.stringify(value)}
        </Text>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, index) => {
        const number = index + 1;
        return (
          <Card key={index} variant="secondary">
            <Card.Header>
              <div className="flex items-center justify-between gap-2">
                <Card.Title level={3}>{t(keys.row, { number })}</Card.Title>
                {isReadOnly ? null : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => report(rows.filter((_, at) => at !== index))}
                  >
                    {t(keys.remove_row, { number })}
                  </Button>
                )}
              </div>
            </Card.Header>
            <Card.Content>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(row).map(([field, value]) =>
                  fieldOf(field, value, (next) =>
                    report(
                      rows.map((held, at) => (at === index ? { ...held, [field]: next } : held)),
                    ),
                  ),
                )}
              </div>
            </Card.Content>
          </Card>
        );
      })}
      {isReadOnly || rows.length === 0 ? null : (
        <div>
          <Button
            size="sm"
            variant="secondary"
            startIcon="plus"
            onPress={() => report([...rows, { ...rows.at(-1) }])}
          >
            {t(keys.add_row)}
          </Button>
        </div>
      )}
    </div>
  );
}
