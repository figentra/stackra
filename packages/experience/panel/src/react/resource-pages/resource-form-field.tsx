/**
 * Stackra file contract:
 * Purpose: `ResourceFormField`, one recorded form element bound into the surrounding schema form: a value field drawn
 *          by its input type (switch, number, select of the enum's codes, text), a picker over an options query, a grid
 *          of fields, and the steps of a set as titled sections.
 * Boundary: internal to the form page; draws `@stackra/ui`'s `Field.*` parts, which read the binding by name, so
 *           validation errors (the schema's and the server's) show on each field. An upload field and a repeater are
 *           not drawn yet; the step set is not a wizard yet (its steps show one under another).
 * Runtime: browser
 * Governing contract: ADR 0307 (form keys are paths of the create or update input); ADR 0055 (thin field adapters).
 */
import type { QueryRef } from "@stackra/clients";
import { useQuery } from "@stackra/clients/react";
import { Enum } from "@stackra/contracts";
import { useTranslation } from "@stackra/i18n/react";
import { Field, FormSection } from "@stackra/ui/react";
import type { ReactElement } from "react";
import type { ZodType } from "zod";

import { inputKind } from "#core/functions/input-kind.function";
import { resourceLabel } from "#core/functions/resource-label.function";
import { valueAt } from "#core/functions/value-at.function";
import type { FieldNode } from "#core/types/field-node.type";

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
  const items = ((answer.data as { readonly items?: readonly object[] } | undefined)?.items ??
    []) as Record<string, unknown>[];
  return (
    <Field.ComboBox
      name={name}
      label={label}
      items={items}
      itemKey="id"
      itemLabel={(item) => String(valueAt(item, labelPath) ?? item["id"])}
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
}: ResourceFormFieldProps): ReactElement | null {
  const { t } = useTranslation();
  const children = (fields: readonly FieldNode[]) =>
    fields.map((child, index) => (
      <ResourceFormField key={index} resourceKey={resourceKey} schema={schema} node={child} />
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
  const label = t(resourceLabel(resourceKey, "fields", node.key));
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
        options={codes.map((code) => ({ value: code, label: code }))}
      />
    );
  if (kind.kind === "boolean") return <Field.Switch name={node.key} label={label} />;
  if (kind.kind === "number") return <Field.Number name={node.key} label={label} />;
  return <Field.Text name={node.key} label={label} />;
}
