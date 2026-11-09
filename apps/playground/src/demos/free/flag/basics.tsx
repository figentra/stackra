/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Flag: one named flag in the three sizes, decorative flags beside the country
 *          names that already say what they are, and flags from language tags, a tag with no region (`sr-Latn`)
 *          showing its code.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); WCAG 2.2 SC 1.1.1; STA-1981.
 */
import { Flag, Text, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { FLAG_KEYS } from "#src/demos/free/flag/flag-keys.constant";

/** The demo's keys. */
const K = FLAG_KEYS.flag.basics;

/** The row that lays the flags out, wrapping on a narrow frame. */
const ROW = "flex flex-wrap items-center gap-4";

/** Flag: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const countries = [
    { code: "sa", name: t(K.saudi_arabia) },
    { code: "ae", name: t(K.united_arab_emirates) },
    { code: "eg", name: t(K.egypt) },
    { code: "gb", name: t(K.united_kingdom) },
  ];
  return (
    <div className="grid gap-4">
      <Text type="small" tone="muted">
        {t(K.sizes)}
      </Text>
      <div className={ROW}>
        {(["sm", "md", "lg"] as const).map((size) => (
          <Flag key={size} code="sa" label={t(K.saudi_arabia)} size={size} />
        ))}
      </div>
      <Text type="small" tone="muted">
        {t(K.countries)}
      </Text>
      <ul className="grid gap-2">
        {countries.map((country) => (
          <li key={country.code} className="flex items-center gap-2">
            {/* No label: the name beside it already says which country it is. */}
            <Flag code={country.code} />
            <Text elementType="span">{country.name}</Text>
          </li>
        ))}
      </ul>
      <Text type="small" tone="muted">
        {t(K.tags)}
      </Text>
      <div className={ROW}>
        <Flag code="ar-SA" label={t(K.arabic_saudi_arabia)} />
        <Flag code="sr-Latn" label={t(K.serbian_latin)} />
      </div>
    </div>
  );
}
