/**
 * Stackra file contract:
 * Purpose: `LocalizedText`, a kit string in English and Arabic (`name`, `line`).
 * Boundary: a type in the leaf entry; other locales are added by key, English is required.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended).
 */

/**
 * Text per locale.
 *
 * @example
 * const title: LocalizedText = { en: "Organza", ar: "أورجانزا" };
 */
export interface LocalizedText {
  /** The English text, always present. */
  readonly en: string;

  /** Arabic; `[TBD]` in a proposed kit. */
  readonly ar?: string;

  /** Any further locale, keyed by BCP 47 tag. */
  readonly [locale: string]: string | undefined;
}
