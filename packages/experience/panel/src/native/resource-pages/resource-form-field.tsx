/**
 * Stackra file contract:
 * Purpose: the native `ResourceFormField`, one recorded form element bound into the surrounding schema form, drawn by
 *          its input type as on the web: a switch, a number, a select of the enum's codes by their labels, text, an
 *          object's keys as a titled group, a list as rows to add and remove, a `currency` as a pick of ISO 4217 codes,
 *          a `…Minor` amount in major units of the currency beside it in the form (else the record's), a JSON value as
 *          JSON text that submits the parsed value, a map of string keys as key and value rows, a calendar day as a
 *          date picker held as `YYYY-MM-DD`, an instant as a day, hour and minute in the phone's time zone held as a
 *          UTC ISO string, a picker over an options query, a grid of fields (stacked: a phone has one column) and the
 *          steps of a set as titled sections.
 * Boundary: internal to the native form page and the action modal. Text and numbers are `@stackra/ui`'s native
 *           `Field.*` parts; the others bind their path with `useSchemaField`, so validation errors (the schema's and
 *           the server's) show on each field. A list binds its rows by index (`parcels.0.weight`); a row's label drops
 *           the index. An upload field and the recorded repeater node are not drawn yet; the step set is not a wizard.
 *           The field state is the web's platform-free hooks (`useListField`, `useRecordField`, `useJsonField`,
 *           `useDateTimeField`, `useMoneyField`) and the pure helpers in `core/functions`.
 * Runtime: react-native
 * Governing contract: ADR 0307 (form keys are paths of the create or update input); ADR 0055 (thin field adapters);
 *          ADR 0164 (native parity).
 */
import type { QueryRef } from "@stackra/clients";
import { useQuery } from "@stackra/clients/native";
import { useTranslation } from "@stackra/i18n/react";
import type { FormFieldBinding } from "@stackra/ui/contracts";
import { useSchemaField } from "@stackra/ui/form";
import {
  Button,
  ComboBox,
  DatePicker,
  Field,
  FormSection,
  NumberField,
  Select,
  Switch,
  TextArea,
  TextField,
} from "@stackra/ui/native";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { ZodType } from "zod";

import { CURRENCY_OPTIONS } from "#core/constants/currency-options.constant";
import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { currencyScale } from "#core/functions/currency-scale.function";
import { dayOf } from "#core/functions/day-of.function";
import { enumChoicesOf } from "#core/functions/enum-choices-of.function";
import { fieldLabelPath } from "#core/functions/field-label-path.function";
import { inputKind } from "#core/functions/input-kind.function";
import { isMinorKey } from "#core/functions/is-minor-key.function";
import { moneyInputOf } from "#core/functions/money-input-of.function";
import { resourceLabel } from "#core/functions/resource-label.function";
import { valueAt } from "#core/functions/value-at.function";
import type { FieldNode } from "#core/types/field-node.type";
import { useDateTimeField } from "#react/resource-pages/use-date-time-field";
import { useFieldEnumLabel } from "#react/resource-pages/use-field-enum-label";
import { useJsonField } from "#react/resource-pages/use-json-field";
import { useListField } from "#react/resource-pages/use-list-field";
import { useMoneyField } from "#react/resource-pages/use-money-field";
import { useRecordField } from "#react/resource-pages/use-record-field";

/** Props of the native `ResourceFormField`. */
interface ResourceFormFieldProps {
  /** The resource key whose labels the fields take. */
  readonly resourceKey: string;
  /** The submitted action's input schema. */
  readonly schema: ZodType;
  /** The element. */
  readonly node: FieldNode;
  /** Another `<module>.<model>` whose enum labels a select tries after the resource's (the modal's action model). */
  readonly enumOwner?: string | undefined;
  /** The record the form edits or the action runs on; a `…Minor` field takes its currency from it. */
  readonly record?: object | undefined;
}

/** The parts of a binding every native field's contract takes as they are; the value and its change are each field's own. */
const bound = ({
  name,
  isInvalid,
  isRequired,
  errorMessage,
}: Pick<FormFieldBinding<unknown>, "name" | "isInvalid" | "isRequired" | "errorMessage">) => ({
  name,
  isInvalid,
  isRequired,
  errorMessage,
});

/** A picker of ids from an options query's rows, labelled by `labelPath`. */
function OptionsField({
  name,
  label,
  query,
  labelPath,
}: {
  readonly name: string;
  readonly label: string;
  readonly query: QueryRef;
  readonly labelPath: string;
}): ReactElement {
  const field = useSchemaField<string | null | undefined>(name);
  // shortcut: the first 100 options only; page through the query when a picker needs more.
  const answer = useQuery(query, { limit: 100 } as never);
  const items = (
    (answer.data as { readonly items?: readonly { readonly id: string }[] } | undefined)?.items ??
    []
  ).map((item) => ({ id: item.id, label: String(valueAt(item, labelPath) ?? item.id) }));
  return (
    <ComboBox
      {...bound(field)}
      label={label}
      items={items}
      isLoading={answer.isPending}
      value={field.value ?? null}
      onChange={(id) => field.onChange?.(id ?? undefined)}
    />
  );
}

/** The rows of a list field: per row an object's group or one field, each with a remove button, and an add button. */
function ListField({
  shared,
  name,
  label,
  item,
}: {
  readonly shared: Omit<ResourceFormFieldProps, "node">;
  readonly name: string;
  readonly label: string;
  readonly item: "object" | "value";
}): ReactElement {
  const { t } = useTranslation();
  const { rows, error, add, remove } = useListField(name);
  return (
    <FormSection title={label} {...(error === undefined ? {} : { description: error })}>
      {rows.map((_, index) => (
        // oxlint-disable-next-line react/no-array-index-key -- reason: a row is its place in the list; the form binds rows by index
        <View key={index} className="gap-2">
          <ResourceFormField {...shared} node={{ kind: "value", key: `${name}.${index}` }} />
          <Button variant="ghost" onPress={() => remove(index)}>
            {t(PANEL_KEYS.panel.resources.remove_item, { number: index + 1 })}
          </Button>
        </View>
      ))}
      <Button variant="secondary" onPress={() => add(item)}>
        {t(PANEL_KEYS.panel.resources.add_item)}
      </Button>
    </FormSection>
  );
}

/** A `…Minor` amount entered in major units of `currency` and held in minor units. */
function MoneyField({
  name,
  label,
  currency,
  scale,
}: {
  readonly name: string;
  readonly label: string;
  readonly currency: string;
  readonly scale: number;
}): ReactElement {
  const { field, value, onChange } = useMoneyField(name, scale);
  return (
    <NumberField
      {...bound(field)}
      label={label}
      formatOptions={{ style: "currency", currency }}
      value={value}
      onChange={onChange}
    />
  );
}

/** A minor-unit amount whose currency is the form's own value at `currencyPath`, entered in major units once known. */
function FormMoneyField({
  name,
  label,
  currencyPath,
}: {
  readonly name: string;
  readonly label: string;
  readonly currencyPath: string;
}): ReactElement {
  const currency = useSchemaField<string | null | undefined>(currencyPath).value;
  const scale = currencyScale(typeof currency === "string" ? currency : undefined);
  // Until a valid currency is chosen the amount stays in minor units, so nothing is scaled by a guess.
  if (typeof currency !== "string" || scale === undefined)
    return <Field.Number name={name} label={label} />;
  return <MoneyField name={name} label={label} currency={currency} scale={scale} />;
}

/** A JSON value edited as JSON text: valid text holds the parsed value, invalid text shows an error and fails the form. */
function JsonField({
  name,
  label,
}: {
  readonly name: string;
  readonly label: string;
}): ReactElement {
  return <TextArea name={name} label={label} rows={6} {...useJsonField(name)} />;
}

/** A map of string keys as key and value rows; a row with an empty key is left out of the value. */
function RecordField({
  name,
  label,
  value: valueKind,
}: {
  readonly name: string;
  readonly label: string;
  readonly value: "number" | "text";
}): ReactElement {
  const { t } = useTranslation();
  const { rows, error, set, add, remove } = useRecordField(name, valueKind);
  return (
    <FormSection title={label} {...(error === undefined ? {} : { description: error })}>
      {rows.map(([key, value], index) => (
        // oxlint-disable-next-line react/no-array-index-key -- reason: a row is its place in the list; its key is being edited
        <View key={index} className="gap-2">
          <TextField
            label={t(PANEL_KEYS.panel.resources.record_key, { number: index + 1 })}
            value={key}
            onChange={(next) => set(index, [next, value])}
          />
          {valueKind === "number" ? (
            <NumberField
              label={t(PANEL_KEYS.panel.resources.record_value, { number: index + 1 })}
              value={typeof value === "number" ? value : null}
              onChange={(next) => set(index, [key, next])}
            />
          ) : (
            <TextField
              label={t(PANEL_KEYS.panel.resources.record_value, { number: index + 1 })}
              value={typeof value === "string" ? value : ""}
              onChange={(next) => set(index, [key, next])}
            />
          )}
          <Button variant="ghost" onPress={() => remove(index)}>
            {t(PANEL_KEYS.panel.resources.remove_item, { number: index + 1 })}
          </Button>
        </View>
      ))}
      <Button variant="secondary" onPress={add}>
        {t(PANEL_KEYS.panel.resources.add_item)}
      </Button>
    </FormSection>
  );
}

/** A calendar day, held as `YYYY-MM-DD`: no time and no time zone. */
function DateInput({
  name,
  label,
}: {
  readonly name: string;
  readonly label: string;
}): ReactElement {
  const field = useSchemaField<string | null | undefined>(name);
  return (
    <DatePicker
      {...bound(field)}
      label={label}
      value={dayOf(field.value)}
      onChange={(day) => field.onChange?.(day === null ? undefined : day.toString())}
    />
  );
}

/**
 * An instant, entered as a day, an hour and a minute in the phone's own time zone (named under the title) and held as
 * the UTC ISO 8601 string every instant schema accepts.
 *
 * shortcut: the hour and minute are two NumberFields, as on the web, until STA-1668's TimeField replaces both.
 */
function DateTimeInput({
  name,
  label,
}: {
  readonly name: string;
  readonly label: string;
}): ReactElement {
  const { t } = useTranslation();
  const { field, parts, change, zone } = useDateTimeField(name);
  return (
    <FormSection title={label} description={t(PANEL_KEYS.panel.resources.time_zone, { zone })}>
      <DatePicker
        {...bound(field)}
        label={t(PANEL_KEYS.panel.resources.date_part)}
        value={parts.day}
        onChange={(day) => change({ ...parts, day })}
      />
      <View className="flex-row gap-2">
        <View className="flex-1">
          <NumberField
            label={t(PANEL_KEYS.panel.resources.hour)}
            minValue={0}
            maxValue={23}
            value={parts.hour}
            onChange={(hour) => change({ ...parts, hour: Number.isNaN(hour) ? null : hour })}
          />
        </View>
        <View className="flex-1">
          <NumberField
            label={t(PANEL_KEYS.panel.resources.minute)}
            minValue={0}
            maxValue={59}
            value={parts.minute}
            onChange={(minute) =>
              change({ ...parts, minute: Number.isNaN(minute) ? null : minute })
            }
          />
        </View>
      </View>
    </FormSection>
  );
}

/** A switch bound to `name`. */
function SwitchInput({
  name,
  label,
}: {
  readonly name: string;
  readonly label: string;
}): ReactElement {
  const field = useSchemaField<boolean | null | undefined>(name);
  return (
    <Switch
      {...bound(field)}
      label={label}
      value={field.value === true}
      onChange={(next) => field.onChange?.(next)}
    />
  );
}

/** A select of `items` bound to `name`. */
function SelectInput({
  name,
  label,
  items,
}: {
  readonly name: string;
  readonly label: string;
  readonly items: readonly { readonly id: string; readonly label: string }[];
}): ReactElement {
  const field = useSchemaField<string | null | undefined>(name);
  return (
    <Select
      {...bound(field)}
      label={label}
      items={items}
      value={field.value ?? null}
      onChange={(id) => field.onChange?.(id ?? undefined)}
    />
  );
}

/** A pick of ISO 4217 codes bound to `name`. */
function CurrencyInput({
  name,
  label,
}: {
  readonly name: string;
  readonly label: string;
}): ReactElement {
  const field = useSchemaField<string | null | undefined>(name);
  return (
    <ComboBox
      {...bound(field)}
      label={label}
      items={CURRENCY_OPTIONS}
      value={field.value ?? null}
      onChange={(id) => field.onChange?.(id ?? undefined)}
    />
  );
}

/**
 * One form element.
 *
 * @example
 * <ResourceFormField resourceKey="orders.order" schema={CreateOrderAction.input} node={FormField.from("note")} />
 */
export function ResourceFormField({
  resourceKey,
  schema,
  node,
  enumOwner,
  record,
}: ResourceFormFieldProps): ReactElement | null {
  const { t } = useTranslation();
  const codeLabel = useFieldEnumLabel(resourceKey, enumOwner);
  const shared = { resourceKey, schema, enumOwner, record };
  const children = (fields: readonly FieldNode[]) =>
    fields.map((child, index) => (
      // oxlint-disable-next-line react/no-array-index-key -- reason: the items have no identity but their place in the list
      <ResourceFormField key={index} {...shared} node={child} />
    ));
  if (node.kind === "grid") return <View className="gap-4">{children(node.fields)}</View>;
  if (node.kind === "steps")
    return (
      <>
        {node.steps.map((step) => (
          <FormSection key={step.name} title={t(resourceLabel(resourceKey, "steps", step.name))}>
            {children(step.fields)}
          </FormSection>
        ))}
      </>
    );
  if (node.kind !== "value") return null;
  const label = t(resourceLabel(resourceKey, "fields", fieldLabelPath(node.key)));
  if (node.options !== undefined)
    return (
      <OptionsField
        name={node.key}
        label={label}
        query={node.options as QueryRef}
        labelPath={node.optionLabel ?? "id"}
      />
    );
  const kind = inputKind(schema, node.key);
  if (kind.kind === "object")
    return (
      <FormSection title={label}>
        {children(kind.keys.map((key) => ({ kind: "value", key: `${node.key}.${key}` })))}
      </FormSection>
    );
  if (kind.kind === "list")
    return <ListField shared={shared} name={node.key} label={label} item={kind.item} />;
  if (kind.kind === "record")
    return <RecordField name={node.key} label={label} value={kind.value} />;
  const choices = enumChoicesOf(node, kind, (code) => codeLabel(node.key, code));
  if (choices !== undefined)
    return (
      <SelectInput
        name={node.key}
        label={label}
        items={choices.map((choice) => ({ id: choice.value, label: choice.label }))}
      />
    );
  if (kind.kind === "boolean") return <SwitchInput name={node.key} label={label} />;
  if (kind.kind === "json") return <JsonField name={node.key} label={label} />;
  if (kind.kind === "date") return <DateInput name={node.key} label={label} />;
  if (kind.kind === "datetime") return <DateTimeInput name={node.key} label={label} />;
  if (kind.kind === "number" && isMinorKey(node.key)) {
    // A currency beside it in the input is the form's own; else the record's known currency, in major units.
    const money = moneyInputOf(schema, node.key, record);
    if (money !== undefined && "currencyPath" in money)
      return <FormMoneyField name={node.key} label={label} currencyPath={money.currencyPath} />;
    if (money !== undefined)
      return (
        <MoneyField name={node.key} label={label} currency={money.currency} scale={money.scale} />
      );
  }
  if (kind.kind === "number") return <Field.Number name={node.key} label={label} />;
  if (fieldLabelPath(node.key).split(".").at(-1) === "currency")
    return <CurrencyInput name={node.key} label={label} />;
  return <Field.Text name={node.key} label={label} />;
}
