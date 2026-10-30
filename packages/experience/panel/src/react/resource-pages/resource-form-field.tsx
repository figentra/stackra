/**
 * Stackra file contract:
 * Purpose: `ResourceFormField`, one recorded form element bound into the surrounding schema form: a value field drawn
 *          by its input type (switch, number, select of the enum's codes by their labels, text, an object's keys as a titled group, a
 *          list as rows to add and remove, a `…Minor` amount in major units of the record's currency), a picker over an options query, a grid of fields, and the steps of a set as
 *          titled sections.
 * Boundary: internal to the form page and the action modal; draws `@stackra/ui`'s `Field.*` parts, which read the
 *           binding by name, so validation errors (the schema's and the server's) show on each field. A list binds its
 *           path with `useSchemaField` and its rows by index (`parcels.0.weight`); a row's label drops the index. An
 *           upload field and the recorded repeater node are not drawn yet; the step set is not a wizard yet.
 * Runtime: browser
 * Governing contract: ADR 0307 (form keys are paths of the create or update input); ADR 0055 (thin field adapters).
 */
import type { QueryRef } from "@stackra/clients";
import { useQuery } from "@stackra/clients/react";
import { Enum } from "@stackra/contracts";
import { useTranslation } from "@stackra/i18n/react";
import { useSchemaField } from "@stackra/ui/form";
import { Button, Field, FormSection, NumberField } from "@stackra/ui/react";
import type { ReactElement } from "react";
import type { ZodType } from "zod";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { inputKind } from "#core/functions/input-kind.function";
import { listCellCurrency } from "#core/functions/list-cell-currency.function";
import { minorUnitScale } from "#core/functions/minor-unit-scale.function";
import { resourceLabel } from "#core/functions/resource-label.function";
import { valueAt } from "#core/functions/value-at.function";
import type { FieldNode } from "#core/types/field-node.type";
import { useEnumLabel } from "#react/resource-pages/use-enum-label";

/** The grid class of each column count; written out so the style scanner keeps them. */
const GRID: Readonly<Record<number, string>> = Object.freeze({
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
});

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
}: {
  readonly name: string;
  readonly label: string;
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
        <div key={index} className="flex items-end gap-2">
          <div className="flex-1">
            <ResourceFormField {...shared} node={{ kind: "value", key: `${name}.${index}` }} />
          </div>
          <Button
            variant="ghost"
            onPress={() => list.onChange(rows.filter((__, other) => other !== index))}
          >
            {t(PANEL_KEYS.panel.resources.remove_item, { number: index + 1 })}
          </Button>
        </div>
      ))}
      <Button
        variant="secondary"
        onPress={() => list.onChange([...rows, item === "object" ? {} : undefined])}
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
      {...field}
      label={label}
      formatOptions={{ style: "currency", currency }}
      value={typeof field.value === "number" ? field.value / scale : null}
      onChange={(major) =>
        field.onChange(
          typeof major === "number" && !Number.isNaN(major) ? Math.round(major * scale) : null,
        )
      }
    />
  );
}

/** The scale of `currency`, or undefined when it is not a currency code (the field then stays in minor units). */
function scaleOf(currency: string | undefined): number | undefined {
  if (currency === undefined) return undefined;
  try {
    return minorUnitScale(currency);
  } catch {
    return undefined;
  }
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
  const codes =
    node.enum === undefined
      ? kind.kind === "enum"
        ? kind.options
        : undefined
      : Enum.values(node.enum).map(String);
  if (codes !== undefined)
    return (
      <Field.Select
        name={node.key}
        label={label}
        options={codes.map((code) => ({
          value: code,
          label:
            enumLabel(resourceKey, fieldLabelPath(node.key), code) ??
            (enumOwner === undefined
              ? undefined
              : enumLabel(enumOwner, fieldLabelPath(node.key), code)) ??
            code,
        }))}
      />
    );
  if (kind.kind === "boolean") return <Field.Switch name={node.key} label={label} />;
  if (kind.kind === "number" && node.key.endsWith("Minor")) {
    // Money travels in minor units; with a known currency it is entered in major units.
    const currency = listCellCurrency(record ?? {}, node.key, record ?? {}, "currency");
    const scale = scaleOf(currency);
    if (currency !== undefined && scale !== undefined)
      return <MoneyField name={node.key} label={label} currency={currency} scale={scale} />;
  }
  if (kind.kind === "number") return <Field.Number name={node.key} label={label} />;
  return <Field.Text name={node.key} label={label} />;
}
