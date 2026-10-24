/**
 * Stackra file contract:
 * Purpose: `TranslatedType`, the ORM column type of a `Translated` field: a jsonb object of locale tag to text in the
 *          database, a `Translated` in the model. Gen's entity metadata writes `{ type: TranslatedType }` for each
 *          field the `Translatable` trait names.
 * Boundary: a MikroORM custom type. It takes a `Translated` or a plain locale map on the way in (a factory gives the
 *           map), and checks the stored map through `Translated.of` on the way out. Values compare as their JSON
 *           text.
 * Runtime: node
 * Governing contract: ADR 0162 (decision 2: per-locale storage in @stackra/model); ADR 0294 (decision 27).
 */
import { Type } from "@mikro-orm/core";

import { Translated } from "#core/values/translated.value";

/** A translated value as the ORM sees it: the value, its locale map, or nothing. */
type TranslatedValue = Translated | Readonly<Record<string, string>> | null | undefined;

/**
 * The jsonb column type of a per-locale field.
 *
 * @example
 * title: { type: TranslatedType },
 */
export class TranslatedType extends Type<TranslatedValue, string | null | undefined> {
  /** A value or a locale map to its JSON text. */
  override convertToDatabaseValue(value: TranslatedValue): string | null | undefined {
    if (value === null || value === undefined) return value;
    return JSON.stringify(value instanceof Translated ? value.values : Translated.of(value).values);
  }

  /** Stored JSON (text, or the object the driver already parsed) to a `Translated`. */
  override convertToJSValue(value: TranslatedValue | string): TranslatedValue {
    if (value === null || value === undefined || value instanceof Translated) return value;
    return Translated.of(
      typeof value === "string" ? (JSON.parse(value) as Record<string, string>) : value,
    );
  }

  /** Two values are equal when their JSON text is. */
  override compareAsType(): string {
    return "string";
  }

  /** A translated value serializes as its locale map. */
  override toJSON(value: TranslatedValue): TranslatedValue {
    return value instanceof Translated ? value.values : value;
  }

  /** The column type, `jsonb`, that holds the locale map. */
  override getColumnType(): string {
    return "jsonb";
  }
}
