/**
 * Stackra file contract:
 * Purpose: `ResourceFormField`, one recorded form element bound into the surrounding schema form: a value field drawn
 *          by its input type (switch, number, select of the enum's codes by their labels, text, an object's keys as a titled group, a
 *          list as rows to add and remove, a `currency` as a pick of ISO 4217 codes, a `…Minor` or money object's
 *          `minor` amount in major units of the currency beside it in the form, else of the record's, a JSON value as
 *          JSON text that submits the parsed value, a map of string keys as key and value rows, a calendar day as a date
 *          picker held as `YYYY-MM-DD`, an instant as a day, hour and minute in the viewer's time zone held as a UTC ISO
 *          string), a picker over an options query, a grid of fields, and the steps of a set as
 *          titled sections.
 * Boundary: internal to the form page and the action modal; draws `@stackra/ui`'s `Field.*` parts, which read the
 *           binding by name, so validation errors (the schema's and the server's) show on each field. A list binds its
 *           path with `useSchemaField` and its rows by index (`parcels.0.weight`); a row's label drops the index. An
 *           upload field and the recorded repeater node are not drawn yet; the step set is not a wizard yet. A value
 *           field's `FormFieldSpec` look applies: its label, help text, placeholder and required, disabled and read-only
 *           overrides on the drawn field; its `control` in place of the inferred one (text, email, password, URL, text
 *           area, number, money, select, radio group, switch, date, combo box, multi-select and slider; any other code
 *           keeps the inferred control); the number bounds, step and format; its span on a grid (`md:col-span-*`); its
 *           `choices` in place of an enum's codes; and `visibleWhen`, which hides it while the form's value at that
 *           path is not true.
 *           The field state is the platform-free hooks shared with native (`useListField`, `useRecordField`,
 *           `useJsonField`, `useDateTimeField`, `useMoneyField`) and the pure helpers in `core/functions`.
 * Runtime: browser
 * Governing contract: ADR 0307 (form keys are paths of the create or update input); ADR 0055 (thin field adapters);
 *                     the SDUI catalogue case `formFields` (STA-1981).
 */
import type { QueryRef } from "@stackra/clients";
import { useQuery } from "@stackra/clients/react";
import { useTranslation } from "@stackra/i18n/react";
import { useSchemaField } from "@stackra/ui/form";
import {
  Button,
  DatePicker,
  Field,
  FormSection,
  MultiSelect,
  NumberField,
  Slider,
  TextAreaField,
  TextField,
} from "@stackra/ui/react";
import type { ReactElement } from "react";
import type { ZodType } from "zod";

import { CURRENCY_OPTIONS } from "#core/constants/currency-options.constant";
import { currencyScale } from "#core/functions/currency-scale.function";
import { dayOf } from "#core/functions/day-of.function";
import { enumChoicesOf } from "#core/functions/enum-choices-of.function";
import { fieldLabelPath } from "#core/functions/field-label-path.function";
import { inputKind } from "#core/functions/input-kind.function";
import { isMinorKey } from "#core/functions/is-minor-key.function";
import { moneyInputOf } from "#core/functions/money-input-of.function";
import { resourceLabel } from "#core/functions/resource-label.function";
import { specText } from "#core/functions/spec-text.function";
import { valueAt } from "#core/functions/value-at.function";
import type { FieldNode } from "#core/types/field-node.type";
import type { FieldPartProps } from "#core/types/field-part-props.type";
import { useDateTimeField } from "#react/resource-pages/use-date-time-field";
import { useFieldEnumLabel } from "#react/resource-pages/use-field-enum-label";
import { useJsonField } from "#react/resource-pages/use-json-field";
import { useListField } from "#react/resource-pages/use-list-field";
import { useMoneyField } from "#react/resource-pages/use-money-field";
import { useRecordField } from "#react/resource-pages/use-record-field";

/** The grid class of each column count; written out so the style scanner keeps them. */
const GRID: Readonly<Record<number, string>> = Object.freeze({
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
});

/** The span class of each column count; written out so the style scanner keeps them. */
const SPAN: Readonly<Record<number, string>> = Object.freeze({
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
});

/** What a spec sets on any drawn field: its help text and its required, disabled and read-only overrides. */
interface FieldLook {
  readonly description?: string;
  readonly isRequired?: boolean;
  readonly isDisabled?: boolean;
  readonly isReadOnly?: boolean;
}

/** Shows `children` only while the form's value at `path` is true. */
function Shown({
  path,
  children,
}: {
  readonly path: string;
  readonly children: ReactElement;
}): ReactElement | null {
  return useSchemaField<unknown>(path).value === true ? children : null;
}

/** A text area bound by `name`. */
function TextAreaInput({
  name,
  ...rest
}: FieldLook &
  FieldPartProps & {
    readonly placeholder?: string;
  }): ReactElement {
  return <TextAreaField {...useSchemaField<string>(name)} {...rest} />;
}

/** A multi-select bound by `name`. */
function MultiSelectInput({
  name,
  ...rest
}: FieldLook &
  FieldPartProps & {
    readonly placeholder?: string;
    readonly items: readonly { readonly id: string; readonly label: string }[];
  }): ReactElement {
  return <MultiSelect {...useSchemaField<readonly string[]>(name)} {...rest} />;
}

/** A slider bound by `name`. */
function SliderInput({
  name,
  ...rest
}: FieldLook &
  FieldPartProps & {
    readonly minValue?: number;
    readonly maxValue?: number;
    readonly step?: number;
    readonly formatOptions?: Intl.NumberFormatOptions;
  }): ReactElement {
  return <Slider {...useSchemaField<number>(name)} {...rest} />;
}

/** Props of `ResourceFormField`. */
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

/** A picker of ids from an options query's rows, labelled by `labelPath`. */
function OptionsField({
  name,
  label,
  query,
  labelPath,
}: FieldPartProps & {
  readonly query: QueryRef;
  readonly labelPath: string;
}): ReactElement {
  // shortcut: the first 100 options only; page through the query when a picker needs more.
  const answer = useQuery(query, { limit: 100 } as never);
  const items =
    (answer.data as { readonly items?: readonly { readonly id: string }[] } | undefined)?.items ??
    [];
  return (
    <Field.ComboBox
      name={name}
      label={label}
      items={items}
      itemKey="id"
      itemLabel={(item) => String(valueAt(item, labelPath) ?? item.id)}
    />
  );
}

/** The rows of a list field: per row an object's group or one field, each with a remove button, and an add button. */
function ListField({
  shared,
  name,
  label,
  item,
}: FieldPartProps & {
  readonly shared: Omit<ResourceFormFieldProps, "node">;
  readonly item: "object" | "value";
}): ReactElement {
  const { section, rows, add } = useListField(name, label, item);
  return (
    <FormSection {...section}>
      {rows.map((row) => (
        <div key={row.path} className="flex items-end gap-2">
          <div className="flex-1">
            <ResourceFormField {...shared} node={{ kind: "value", key: row.path }} />
          </div>
          <Button variant="ghost" {...row.remove} />
        </div>
      ))}
      <Button variant="secondary" {...add} />
    </FormSection>
  );
}

/** A `…Minor` amount entered in major units of `currency` and held in minor units. */
function MoneyField({
  name,
  label,
  currency,
  scale,
}: FieldPartProps & {
  readonly currency: string;
  readonly scale: number;
}): ReactElement {
  const { field, value, onChange } = useMoneyField(name, scale);
  return (
    <NumberField
      {...field}
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
}: FieldPartProps & {
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
function JsonField({ name, label }: FieldPartProps): ReactElement {
  return <TextAreaField name={name} label={label} rows={6} {...useJsonField(name)} />;
}

/** A map of string keys as key and value rows; a row with an empty key is left out of the value. */
function RecordField({
  name,
  label,
  value: valueKind,
}: FieldPartProps & {
  readonly value: "number" | "text";
}): ReactElement {
  const { section, rows, add } = useRecordField(name, label, valueKind);
  return (
    <FormSection {...section}>
      {rows.map((row, index) => (
        // oxlint-disable-next-line react/no-array-index-key -- reason: a row is its place in the list; its key is being edited
        <div key={index} className="flex items-end gap-2">
          <TextField {...row.key} />
          {row.number === undefined ? <TextField {...row.text} /> : <NumberField {...row.number} />}
          <Button variant="ghost" {...row.remove} />
        </div>
      ))}
      <Button variant="secondary" {...add} />
    </FormSection>
  );
}

/** A calendar day, held as `YYYY-MM-DD`: no time and no time zone. */
function DateInput({ name, label }: FieldPartProps): ReactElement {
  const field = useSchemaField<string | null | undefined>(name);
  return (
    <DatePicker
      label={label}
      value={dayOf(field.value)}
      onChange={(day) => field.onChange?.(day === null ? undefined : day.toString())}
      onBlur={field.onBlur}
      isInvalid={field.isInvalid}
      errorMessage={field.errorMessage}
    />
  );
}

/**
 * An instant, entered as a day, an hour and a minute in the viewer's own time zone (named under the title) and held as
 * the UTC ISO 8601 string (`2026-11-01T06:30:00.000Z`) every instant schema accepts.
 *
 * shortcut: the hour and minute are two NumberFields because @stackra/ui wraps no TimeField; STA-1668 adds one, which
 * replaces them.
 */
function DateTimeInput({ name, label }: FieldPartProps): ReactElement {
  const { field, section, day, hour, minute } = useDateTimeField(name, label);
  return (
    <FormSection {...section}>
      <div className="flex items-end gap-2">
        <DatePicker
          {...day}
          onBlur={field.onBlur}
          isInvalid={field.isInvalid}
          errorMessage={field.errorMessage}
        />
        <NumberField {...hour} />
        <NumberField {...minute} />
      </div>
    </FormSection>
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
    fields.map((child, index) => {
      // oxlint-disable-next-line react/no-array-index-key -- reason: the items have no identity but their place in the list
      const field = <ResourceFormField key={index} {...shared} node={child} />;
      const span = child.kind === "value" ? SPAN[child.span ?? 1] : undefined;
      return span === undefined ? (
        field
      ) : (
        // oxlint-disable-next-line react/no-array-index-key -- reason: the items have no identity but their place in the list
        <div key={index} className={span}>
          {field}
        </div>
      );
    });
  if (node.kind === "grid")
    return <div className={`grid gap-4 ${GRID[node.columns] ?? ""}`}>{children(node.fields)}</div>;
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
  if (node.visibleWhen !== undefined) {
    const { visibleWhen, ...always } = node;
    return (
      <Shown path={visibleWhen}>
        <ResourceFormField {...shared} node={always} />
      </Shown>
    );
  }
  const label =
    node.label === undefined
      ? t(resourceLabel(resourceKey, "fields", fieldLabelPath(node.key)))
      : specText(node.label, t);
  const look: FieldLook = {
    ...(node.description === undefined ? {} : { description: specText(node.description, t) }),
    ...(node.isRequired === undefined ? {} : { isRequired: node.isRequired }),
    ...(node.isDisabled === undefined ? {} : { isDisabled: node.isDisabled }),
    ...(node.isReadOnly === undefined ? {} : { isReadOnly: node.isReadOnly }),
  };
  const placeholder =
    node.placeholder === undefined ? {} : { placeholder: specText(node.placeholder, t) };
  const numbers = {
    ...(node.minValue === undefined ? {} : { minValue: node.minValue }),
    ...(node.maxValue === undefined ? {} : { maxValue: node.maxValue }),
    ...(node.step === undefined ? {} : { step: node.step }),
    ...(node.formatOptions === undefined ? {} : { formatOptions: node.formatOptions }),
  };
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
  // The spec's choices win over the enum's codes, which show by their labels.
  const choices =
    node.choices?.map((choice) => ({ value: choice.value, label: specText(choice.label, t) })) ??
    enumChoicesOf(node, kind, (code) => codeLabel(node.key, code));
  const items = choices?.map((choice) => ({ id: choice.value, label: choice.label })) ?? [];
  switch (node.control) {
    case "text":
    case "email":
    case "password":
    case "url": {
      return (
        <Field.Text
          name={node.key}
          label={label}
          {...look}
          {...placeholder}
          {...(node.control === "text" ? {} : { type: node.control })}
        />
      );
    }
    case "textarea": {
      return <TextAreaInput name={node.key} label={label} {...look} {...placeholder} />;
    }
    case "number": {
      return <Field.Number name={node.key} label={label} {...look} {...numbers} />;
    }
    case "select": {
      if (choices !== undefined)
        return (
          <Field.Select
            name={node.key}
            label={label}
            options={choices}
            {...look}
            {...placeholder}
          />
        );
      break;
    }
    case "radio": {
      if (choices !== undefined)
        return <Field.RadioGroup name={node.key} label={label} options={choices} {...look} />;
      break;
    }
    case "switch": {
      return <Field.Switch name={node.key} label={label} {...look} />;
    }
    case "date": {
      return <DateInput name={node.key} label={label} />;
    }
    case "combo-box": {
      return (
        <Field.ComboBox
          name={node.key}
          label={label}
          items={items}
          itemKey="id"
          itemLabel={(item) => item.label}
          {...look}
          {...placeholder}
        />
      );
    }
    case "multi-select": {
      return (
        <MultiSelectInput name={node.key} label={label} items={items} {...look} {...placeholder} />
      );
    }
    case "slider": {
      return <SliderInput name={node.key} label={label} {...look} {...numbers} />;
    }
    default: {
      // Money is the inferred minor-unit path below; any other code keeps the inferred control.
      break;
    }
  }
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
  if (choices !== undefined)
    return (
      <Field.Select name={node.key} label={label} options={choices} {...look} {...placeholder} />
    );
  if (kind.kind === "boolean") return <Field.Switch name={node.key} label={label} {...look} />;
  if (kind.kind === "json") return <JsonField name={node.key} label={label} />;
  if (kind.kind === "date") return <DateInput name={node.key} label={label} />;
  if (kind.kind === "datetime") return <DateTimeInput name={node.key} label={label} />;
  if ((kind.kind === "number" && isMinorKey(node.key)) || node.control === "money") {
    // A currency beside it in the input is the form's own; else the record's known currency, in major units.
    const money = moneyInputOf(schema, node.key, record);
    if (money !== undefined && "currencyPath" in money)
      return <FormMoneyField name={node.key} label={label} currencyPath={money.currencyPath} />;
    if (money !== undefined)
      return (
        <MoneyField name={node.key} label={label} currency={money.currency} scale={money.scale} />
      );
  }
  if (kind.kind === "number")
    return <Field.Number name={node.key} label={label} {...look} {...numbers} />;
  if (fieldLabelPath(node.key).split(".").at(-1) === "currency")
    return (
      <Field.ComboBox
        name={node.key}
        label={label}
        items={CURRENCY_OPTIONS}
        itemKey="id"
        itemLabel={(item) => item.id}
        {...look}
      />
    );
  return <Field.Text name={node.key} label={label} {...look} {...placeholder} />;
}
