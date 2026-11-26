/**
 * Stackra file contract:
 * Purpose: `DOCS_LOCALE_UI`, what a generated docs site needs per language beyond its pages: the Fumadocs interface
 *          strings (search, table of contents, previous and next), the labels of the tab and group gen adds (the API
 *          reference), and the web font, by base language code.
 * Boundary: data only. A language not listed keeps Fumadocs's English strings and the site's default font. Arabic
 *           strings follow the family glossary and voice guide: Modern Standard Arabic, Western digits.
 * Runtime: isomorphic
 * Governing contract: ADR 0514 (Fumadocs docs sites); brand family/i18n/ar-voice.md (§5 numerals, §7 RTL).
 */
import type { DocsLocaleUi } from "#core/types/docs-locale-ui.type";

/** Per base language code: Fumadocs strings, gen's own labels, and the font. */
export const DOCS_LOCALE_UI: Readonly<Record<string, DocsLocaleUi>> = {
  ar: {
    translations: {
      search: "ابحث",
      searchNoResult: "لا نتائج",
      toc: "في هذه الصفحة",
      tocNoHeadings: "لا عناوين",
      lastUpdate: "آخر تحديث",
      chooseLanguage: "اختر اللغة",
      nextPage: "التالي",
      previousPage: "السابق",
      chooseTheme: "المظهر",
      editOnGithub: "حرّر الصفحة",
    },
    labels: { "API reference": "مرجع الواجهة البرمجية", Services: "الخدمات" },
    font: {
      family: "IBM Plex Sans Arabic",
      href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700&display=swap",
    },
  },
};
