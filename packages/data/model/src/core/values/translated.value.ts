/**
 * Stackra file contract:
 * Purpose: `Translated`, the value of a per-locale field (`title!: Translated`): one string per locale tag, read with
 *          `.in(locale)` through the fallback chain.
 * Boundary: a value class holding a frozen copy of its locale map; it serializes as that map, which is the jsonb
 *           column and the wire form. The fallback chain is the exact tag, then its language (`ar-EG` falls back to
 *           `ar`), then the first locale stored (the one the record was written in). Building one checks the map.
 * Runtime: isomorphic
 * Governing contract: ADR 0162 (decision 2: per-locale storage and the fallback chain in @stackra/model); ADR 0096.
 */

/**
 * A string per locale.
 *
 * @example
 * const title = Translated.of({ en: "Shirt", ar: "قميص" });
 * title.in("ar-EG"); // "قميص"
 * title.in("fr"); // "Shirt"
 */
export class Translated {
  /** The value per locale tag, in the order they were written. */
  readonly values: Readonly<Record<string, string>>;

  private constructor(values: Readonly<Record<string, string>>) {
    this.values = values;
  }

  /**
   * A translated value from its locale map.
   *
   * @param values - locale tag to text (`{ en: "Shirt" }`).
   * @throws TypeError when `values` is not an object of non-empty tags to strings.
   */
  static of(values: Readonly<Record<string, string>>): Translated {
    if (typeof values !== "object" || values === null || Array.isArray(values))
      throw new TypeError("Translated.of takes an object of locale tags to strings");
    for (const [locale, text] of Object.entries(values))
      if (locale === "" || typeof text !== "string")
        throw new TypeError(`Translated.of: "${locale}" must be a locale tag with a string value`);
    return new Translated(Object.freeze({ ...values }));
  }

  /**
   * The text for `locale`: the exact tag, else its language, else the first locale stored.
   *
   * @returns `""` when no locale is stored.
   */
  in(locale: string): string {
    const language = locale.split("-")[0] ?? locale;
    return this.values[locale] ?? this.values[language] ?? Object.values(this.values)[0] ?? "";
  }

  /** The locale map, the stored and wire form. */
  toJSON(): Readonly<Record<string, string>> {
    return this.values;
  }
}
