/**
 * Stackra file contract:
 * Purpose: `OperandEditor`, the rule builder's editor of a leaf's value in the shape its operator takes: nothing, a
 *          choice or several choices of an enum field, or text fields (one value, a comma-separated list, a range's
 *          two ends, a duration such as `30d`, a circle's centre and radius).
 * Boundary: internal to the `./react` entry. It keeps the typed text while the user edits, and starts again from the
 *           value when the parent passes one it did not report (a new test, or a removal that moved another leaf into
 *           its place). It reports the value the text reads as: a number, a money amount from `12.50 USD`, an instant
 *           from `2026-10-01` (midnight UTC) or a full ISO 8601 time. Text that reads as no valid value is reported as
 *           written, so the check marks it rather than the builder dropping it.
 * Runtime: react
 * Governing contract: ADR 0331 (decisions 3 and 8); ADR 0220 (money); ADR 0302 (web UI from @stackra/ui).
 */
import { Enum, type Json } from "@stackra/contracts";
import type { I18nKey } from "@stackra/i18n";
import { useTranslation } from "@stackra/i18n/react";
import { Money } from "@stackra/money";
import { CheckboxGroup, Select, TextField } from "@stackra/ui/react";
import { type ReactElement, useState } from "react";

import { type FactField, FieldType, Operator } from "#contracts/index";
import { moneyOf } from "#core/functions/money-of.function";
import type { OperandEditorProps } from "#react/rule-builder/operand-editor.props";
import { RULE_BUILDER_KEYS as KEYS } from "#react/rule-builder/rule-builder-keys.constant";

/** The shape of an operator's value. */
type Shape = (typeof Operator)["~enum"][Operator]["operand"];

/** The label of each text field of a shape. */
const SLOTS: Readonly<Record<Shape, readonly I18nKey[]>> = {
  none: [],
  one: [KEYS.operands.value],
  many: [KEYS.operands.values],
  range: [KEYS.operands.from, KEYS.operands.to],
  duration: [KEYS.operands.duration],
  circle: [KEYS.operands.latitude, KEYS.operands.longitude, KEYS.operands.radius],
};

/** A plain decimal number. */
const DECIMAL = /^-?\d+(?:\.\d+)?$/;

/** An amount and a currency code (`12.50 USD`). */
const AMOUNT = /^(-?\d+(?:\.\d+)?)\s*([A-Za-z]{3})$/;

/** A calendar date with no time. */
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Text as a number, or as written when it is not one. */
const numberOf = (text: string): Json => (DECIMAL.test(text.trim()) ? Number(text.trim()) : text);

/** One element of `field`'s type read from text. */
function elementOf(field: FactField, text: string): Json {
  const trimmed = text.trim();
  if (field.type === FieldType.Number) return numberOf(text);
  if (field.type === FieldType.Date) return DAY.test(trimmed) ? `${trimmed}T00:00:00Z` : trimmed;
  if (field.type !== FieldType.Money) return text;
  const match = AMOUNT.exec(trimmed);
  if (match === null) return text;
  try {
    const amount = Money.of(match[1] ?? "", (match[2] ?? "").toUpperCase());
    return { minor: amount.minor, currency: amount.currency };
  } catch {
    return text;
  }
}

/** One element as the text that reads back as it. */
function textOf(element: unknown): string {
  const amount = moneyOf(element);
  if (amount !== undefined) return `${amount.toDecimal()} ${amount.currency}`;
  return typeof element === "string" || typeof element === "number" ? String(element) : "";
}

/** The text fields' starting text for `value`. */
function textsOf(shape: Shape, value: Json | undefined): string[] {
  const items = Array.isArray(value) ? value : [];
  if (shape === "many") return [items.map(textOf).join(", ")];
  if (shape === "range") return [textOf(items[0]), textOf(items[1])];
  if (shape !== "circle") return [textOf(value)];
  const circle: Readonly<Record<string, Json>> =
    typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
  return [
    textOf(circle["latitude"]),
    textOf(circle["longitude"]),
    textOf(circle["radiusKilometres"]),
  ];
}

/** The value the text fields read as. */
function valueOf(field: FactField, shape: Shape, texts: readonly string[]): Json {
  const [first = "", second = "", third = ""] = texts;
  switch (shape) {
    case "many":
      return first
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "")
        .map((item) => elementOf(field, item));
    case "range":
      return [elementOf(field, first), elementOf(field, second)];
    case "duration":
      return first.trim();
    case "circle":
      return {
        latitude: numberOf(first),
        longitude: numberOf(second),
        radiusKilometres: numberOf(third),
      };
    default:
      return elementOf(field, first);
  }
}

/**
 * A leaf's value.
 *
 * @example
 * <OperandEditor field={field} operator={Operator.Between} value={[1, 5]} isReadOnly={false} onChange={setValue} />
 */
export function OperandEditor({
  field,
  operator,
  value,
  isReadOnly,
  errorMessage,
  onChange,
}: OperandEditorProps): ReactElement | null {
  const { t } = useTranslation();
  const shape = Enum.meta(Operator, operator).operand;
  const [draft, setDraft] = useState(() => ({ value, texts: textsOf(shape, value) }));
  // The parent gave a value this editor did not report (a removal moved another leaf here): start again from it.
  const isStale = draft.value !== value && JSON.stringify(draft.value) !== JSON.stringify(value);
  if (isStale) setDraft({ value, texts: textsOf(shape, value) });
  const texts = isStale ? textsOf(shape, value) : draft.texts;
  const isInvalid = errorMessage !== undefined;
  const choices = Object.entries(field.values ?? {});

  if (shape === "none") return null;
  if (field.type === FieldType.Enum && shape === "one")
    return (
      <Select
        label={t(KEYS.operands.value)}
        items={choices.map(([code, label]) => ({ id: code, label: t(label) }))}
        value={typeof value === "string" ? value : null}
        isReadOnly={isReadOnly}
        isInvalid={isInvalid}
        errorMessage={errorMessage}
        onChange={(next) => onChange(next ?? undefined)}
      />
    );
  if (field.type === FieldType.Enum && shape === "many")
    return (
      <CheckboxGroup
        label={t(KEYS.operands.values)}
        options={choices.map(([code, label]) => ({ value: code, label: t(label) }))}
        value={Array.isArray(value) ? value.filter((item) => typeof item === "string") : []}
        isReadOnly={isReadOnly}
        isInvalid={isInvalid}
        errorMessage={errorMessage}
        onChange={(next) => onChange([...next])}
      />
    );

  const hint =
    shape === "many" || shape === "duration"
      ? KEYS.hints[shape]
      : field.type === FieldType.Money || field.type === FieldType.Date
        ? KEYS.hints[field.type]
        : undefined;
  const slots = SLOTS[shape];
  return (
    <>
      {slots.map((label, index) => (
        <TextField
          key={label}
          label={t(label)}
          description={index === 0 && hint !== undefined ? t(hint) : undefined}
          value={texts[index] ?? ""}
          isReadOnly={isReadOnly}
          isInvalid={isInvalid}
          errorMessage={index === slots.length - 1 ? errorMessage : undefined}
          onChange={(text) => {
            const nextTexts = slots.map((_, at) => (at === index ? text : (texts[at] ?? "")));
            const next = valueOf(field, shape, nextTexts);
            setDraft({ value: next, texts: nextTexts });
            onChange(next);
          }}
        />
      ))}
    </>
  );
}
