/**
 * Stackra file contract:
 * Purpose: `TypographySpecimen`, the typography page's specimen hero: the Latin and Arabic faces side by side at display
 *          size, then the brand line set at every heading level and in body and small text, each row in both scripts,
 *          so the pairing and the scale are seen at once.
 * Boundary: presentation over `Heading` and `Text`; Arabic rows get no letter spacing (the components' type tokens),
 *           each script its own `lang` and `dir`.
 * Runtime: browser
 * Governing contract: STA-1371 (doc pages wave: typography specimen hero, 2026-10-28); arabic-reversed-letters rules.
 */
import { lookupMessage } from "@stackra/showcase";
import { Card, Heading, Text, useCatalogueText } from "@stackra/ui/react";

import { DOC_PAGE_KEYS } from "#src/components/doc-page/doc-page-keys.constant";
import { MESSAGES } from "#src/constants/messages.constant";

const K = DOC_PAGE_KEYS.showcase.doc.ui;

/** The heading levels the specimen shows. */
const LEVELS = [1, 2, 3, 4] as const;

/** The two scripts, each read in its own language whatever the page's. */
const SCRIPTS = [
  { lang: "en", dir: "ltr", glyphs: "Aa" },
  { lang: "ar", dir: "rtl", glyphs: "أب" },
] as const;

/** The specimen. */
export function TypographySpecimen() {
  const t = useCatalogueText(MESSAGES.en);
  // Each script reads its own catalogue, whatever the page's language.
  const sample = {
    en: lookupMessage(MESSAGES.en["showcase"], K.specimen_sample) ?? "",
    ar: lookupMessage(MESSAGES.ar["showcase"], K.specimen_sample) ?? "",
  };
  return (
    <Card className="grid gap-6 p-6">
      <div className="grid gap-2">
        <Heading level={2}>{t(K.specimen_title)}</Heading>
        <Text tone="muted" className="max-w-prose">
          {t(K.specimen_intro)}
        </Text>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {SCRIPTS.map((script) => (
          <div key={script.lang} lang={script.lang} dir={script.dir} className="grid gap-1">
            <span aria-hidden className="text-7xl leading-none font-semibold">
              {script.glyphs}
            </span>
          </div>
        ))}
      </div>
      {/* A visual specimen: the same line repeated per size would only be noise to a screen reader. */}
      <ol aria-hidden className="grid gap-4">
        {LEVELS.map((level) => (
          <li key={level} className="grid gap-2 border-t border-separator pt-3 sm:grid-cols-2">
            {SCRIPTS.map((script) => (
              <div key={script.lang} lang={script.lang} dir={script.dir}>
                <Heading level={3} type={`h${level}`}>
                  {sample[script.lang]}
                </Heading>
              </div>
            ))}
          </li>
        ))}
        {(["body", "small"] as const).map((type) => (
          <li key={type} className="grid gap-2 border-t border-separator pt-3 sm:grid-cols-2">
            {SCRIPTS.map((script) => (
              <div key={script.lang} lang={script.lang} dir={script.dir}>
                <Text type={type}>{sample[script.lang]}</Text>
              </div>
            ))}
          </li>
        ))}
      </ol>
    </Card>
  );
}
