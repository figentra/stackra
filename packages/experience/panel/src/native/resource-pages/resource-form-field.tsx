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
 * Runtime: react-native
 * Governing contract: ADR 0307 (form keys are paths of the create or update input); ADR 0055 (thin field adapters);
 *          ADR 0164 (native parity).
 */
import { CalendarDate, parseDate } from "@internationalized/date";
import type { QueryRef } from "@stackra/clients";
import { useQuery } from "@stackra/clients/native";
import { Enum } from "@stackra/contracts";
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
import { useState, type ReactElement } from "react";
import { View } from "react-native";
import type { ZodType } from "zod";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { inputKind } from "#core/functions/input-kind.function";
import { listCellCurrency } from "#core/functions/list-cell-currency.function";
import { minorUnitScale } from "#core/functions/minor-unit-scale.function";
import { resourceLabel } from "#core/functions/resource-label.function";
import { valueAt } from "#core/functions/value-at.function";
import type { FieldNode } from "#core/types/field-node.type";
import { useEnumLabel } from "#react/resource-pages/use-enum-label";

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

/** The label path of a form key: a list row's index is dropped (`parcels.0.weight` is `parcels.weight`). */
const fieldLabelPath = (key: string): string => key.replaceAll(/\.\d+(?=\.|$)/g, "");

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
  const list = useSchemaField<readonly unknown[] | null | undefined>(name);
  const rows = Array.isArray(list.value) ? list.value : [];
  const error =
    list.isInvalid === true && typeof list.errorMessage === "string"
      ? list.errorMessage
      : undefined;
  return (
    <FormSection title={label} {...(error === undefined ? {} : { description: error })}>
      {rows.map((_, index) => (
        // oxlint-disable-next-line react/no-array-index-key -- reason: a row is its place in the list; the form binds rows by index
        <View key={index} className="gap-2">
          <ResourceFormField {...shared} node={{ kind: "value", key: `${name}.${index}` }} />
          <Button
            variant="ghost"
            onPress={() => list.onChange?.(rows.filter((__, other) => other !== index))}
          >
            {t(PANEL_KEYS.panel.resources.remove_item, { number: index + 1 })}
          </Button>
        </View>
      ))}
      <Button
        variant="secondary"
        onPress={() => list.onChange?.([...rows, item === "object" ? {} : undefined])}
      >
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
  const field = useSchemaField<number | null>(name);
  return (
    <NumberField
      {...bound(field)}
      label={label}
      formatOptions={{ style: "currency", currency }}
      value={typeof field.value === "number" ? field.value / scale : null}
      onChange={(major) =>
        field.onChange?.(
          typeof major === "number" && !Number.isNaN(major) ? Math.round(major * scale) : null,
        )
      }
    />
  );
}

/** Whether `key` holds minor units: a `…Minor` field or a money object's `minor`. */
const isMinorKey = (key: string): boolean =>
  key.endsWith("Minor") || key === "minor" || key.endsWith(".minor");

/** The `currency` path beside `key` (`totals.totalMinor` and `cost.minor` sit beside `totals.currency`, `cost.currency`). */
const currencyBeside = (key: string): string => `${key.slice(0, key.lastIndexOf(".") + 1)}currency`;

/** The ISO 4217 codes a currency field offers. */
const CURRENCIES: readonly { readonly id: string; readonly label: string }[] =
  Intl.supportedValuesOf("currency").map((id) => ({ id, label: id }));

/** The scale of `currency`, or undefined when it is not a currency code (the field then stays in minor units). */
function scaleOf(currency: string | undefined): number | undefined {
  if (currency === undefined) return undefined;
  try {
    return minorUnitScale(currency);
  } catch {
    return undefined;
  }
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
  const scale = scaleOf(typeof currency === "string" ? currency : undefined);
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
  const { t } = useTranslation();
  const field = useSchemaField<unknown>(name);
  const [text, setText] = useState(() =>
    field.value === undefined ? "" : JSON.stringify(field.value, null, 2),
  );
  const [isBroken, setBroken] = useState(false);
  const onChange = (next: string) => {
    setText(next);
    setBroken(false);
    if (next.trim() === "") return field.onChange?.(undefined);
    try {
      field.onChange?.(JSON.parse(next));
    } catch {
      setBroken(true);
      // NaN is no JSON value, so the schema refuses the submit until the text parses; the raw text never goes out.
      field.onChange?.(Number.NaN);
    }
  };
  return (
    <TextArea
      name={name}
      label={label}
      rows={6}
      value={text}
      onChange={onChange}
      onBlur={field.onBlur}
      isInvalid={isBroken || field.isInvalid === true}
      errorMessage={isBroken ? t(PANEL_KEYS.panel.resources.invalid_json) : field.errorMessage}
    />
  );
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
  const field = useSchemaField<Readonly<Record<string, unknown>> | null | undefined>(name);
  // The rows live here: a key being typed or renamed, or a second row with the same key, is not yet a valid map.
  const [rows, setRows] = useState<readonly (readonly [string, unknown])[]>(() =>
    Object.entries(field.value ?? {}),
  );
  const change = (next: readonly (readonly [string, unknown])[]) => {
    setRows(next);
    // shortcut: a repeated key keeps its last row's value; flag duplicates if a map ever needs it.
    field.onChange?.(Object.fromEntries(next.filter(([key]) => key.trim() !== "")));
  };
  const set = (index: number, row: readonly [string, unknown]) =>
    change(rows.map((other, at) => (at === index ? row : other)));
  const error =
    field.isInvalid === true && typeof field.errorMessage === "string"
      ? field.errorMessage
      : undefined;
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
          <Button variant="ghost" onPress={() => change(rows.filter((__, at) => at !== index))}>
            {t(PANEL_KEYS.panel.resources.remove_item, { number: index + 1 })}
          </Button>
        </View>
      ))}
      <Button
        variant="secondary"
        onPress={() => change([...rows, ["", valueKind === "number" ? null : ""]])}
      >
        {t(PANEL_KEYS.panel.resources.add_item)}
      </Button>
    </FormSection>
  );
}

/** The calendar day of a `YYYY-MM-DD` value, or null for anything else. */
function dayOf(value: unknown): CalendarDate | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  try {
    return parseDate(value);
  } catch {
    return null;
  }
}

/** The instant a Date or an ISO 8601 string holds, or undefined. */
function instantOf(value: unknown): Date | undefined {
  const instant =
    value instanceof Date ? value : typeof value === "string" ? new Date(value) : undefined;
  return instant === undefined || Number.isNaN(instant.getTime()) ? undefined : instant;
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
  const field = useSchemaField<Date | string | null | undefined>(name);
  // The parts live here: a day without its time yet is not an instant.
  const [parts, setParts] = useState(() => {
    const instant = instantOf(field.value);
    return {
      day:
        instant === undefined
          ? null
          : new CalendarDate(instant.getFullYear(), instant.getMonth() + 1, instant.getDate()),
      hour: instant?.getHours() ?? null,
      minute: instant?.getMinutes() ?? null,
    };
  });
  const change = (next: typeof parts) => {
    setParts(next);
    const { day, hour, minute } = next;
    // `new Date(y, m, d, h, min)` reads the parts in the phone's time zone; an empty time is the start of the day.
    field.onChange?.(
      day === null
        ? undefined
        : new Date(day.year, day.month - 1, day.day, hour ?? 0, minute ?? 0).toISOString(),
    );
  };
  const zone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
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
      items={CURRENCIES}
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
  const enumLabel = useEnumLabel();
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
  const codes =
    node.enum === undefined
      ? kind.kind === "enum"
        ? kind.options
        : undefined
      : Enum.values(node.enum).map(String);
  if (codes !== undefined)
    return (
      <SelectInput
        name={node.key}
        label={label}
        items={codes.map((code) => ({
          id: code,
          label:
            enumLabel(resourceKey, fieldLabelPath(node.key), code) ??
            (enumOwner === undefined
              ? undefined
              : enumLabel(enumOwner, fieldLabelPath(node.key), code)) ??
            code,
        }))}
      />
    );
  if (kind.kind === "boolean") return <SwitchInput name={node.key} label={label} />;
  if (kind.kind === "json") return <JsonField name={node.key} label={label} />;
  if (kind.kind === "date") return <DateInput name={node.key} label={label} />;
  if (kind.kind === "datetime") return <DateTimeInput name={node.key} label={label} />;
  if (kind.kind === "number" && isMinorKey(node.key)) {
    // A currency beside it in the input (a MoneyAmount, a list row's `priceMinor` and `currency`) is the form's own.
    const beside = currencyBeside(node.key);
    if (inputKind(schema, beside).kind !== "missing")
      return <FormMoneyField name={node.key} label={label} currencyPath={beside} />;
    // Money travels in minor units; with a known currency it is entered in major units.
    const currency = listCellCurrency(record ?? {}, node.key, record ?? {}, "currency");
    const scale = scaleOf(currency);
    if (currency !== undefined && scale !== undefined)
      return <MoneyField name={node.key} label={label} currency={currency} scale={scale} />;
  }
  if (kind.kind === "number") return <Field.Number name={node.key} label={label} />;
  if (fieldLabelPath(node.key).split(".").at(-1) === "currency")
    return <CurrencyInput name={node.key} label={label} />;
  return <Field.Text name={node.key} label={label} />;
}
