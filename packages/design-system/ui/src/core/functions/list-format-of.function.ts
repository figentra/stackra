/**
 * Stackra file contract:
 * Purpose: `listFormatOf(locale, options)`, a list joiner on Intl.ListFormat ("A, B and C", "أ وب وج").
 * Boundary: pure. Hermes (React Native's engine) has no Intl.ListFormat, where a component that joined names threw
 *           "undefined cannot be used as a constructor"; there the items are joined with the locale's comma.
 * Runtime: isomorphic
 * Governing contract: ADR 0060 (right-to-left); STA-1371.
 */

/**
 * The list joiner of a locale.
 * @param locale - a BCP 47 tag
 * @param options - Intl.ListFormat's options
 * @returns an object whose `format` joins the items
 */
export function listFormatOf(
  locale: string,
  options?: Intl.ListFormatOptions,
): { format: (items: Iterable<string>) => string } {
  if (typeof Intl.ListFormat === "function") return new Intl.ListFormat(locale, options);
  // shortcut: commas only, no "and", where the runtime has no ListFormat (Hermes); bundle CLDR list patterns if needed.
  const comma = locale.toLowerCase().startsWith("ar") ? "، " : ", ";
  return { format: (items) => [...items].join(comma) };
}
