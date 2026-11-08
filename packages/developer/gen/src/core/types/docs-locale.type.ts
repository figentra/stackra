/**
 * Stackra file contract:
 * Purpose: `DocsLocale`, one language of a docs site: its code, the label of the language switch, its text direction,
 *          whether it is the default, and the labels of the navigation's tabs and groups in it.
 * Boundary: a type only. A page of a non-default locale sits beside its default page as `<page>.<code>.mdx` and is
 *           served under `/<code>/`; the default locale keeps the unprefixed paths.
 * Runtime: isomorphic
 * Governing contract: ADR 0514 (Fumadocs docs sites); brand family/i18n/ar-voice.md §7 (RTL).
 */

/** One language of a docs site. */
export interface DocsLocale {
  /** The language code, lower case, with an optional upper-case region: `en`, `ar`, `ar-SA`. */
  readonly code: string;

  /** The name in the language switch, written in that language: `English`, `العربية`. */
  readonly label: string;

  /** The text direction; `ltr` when absent. */
  readonly dir?: "ltr" | "rtl";

  /** Whether it is the default locale: its pages are the source pages and keep the unprefixed paths. */
  readonly default?: boolean;

  /** The navigation's tab and group names in this language, by their authored (default-locale) name. */
  readonly labels?: Readonly<Record<string, string>>;
}
