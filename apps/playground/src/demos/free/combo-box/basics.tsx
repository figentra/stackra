/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Combo box: A visible label with a placeholder, a label with a description,
 *          and a field with no visible label that is named for assistive technology.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0055; ADR 0060 (light, dark, RTL).
 */
import { ComboBox as UiComboBox, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { COMBO_BOX_KEYS } from "#src/demos/free/combo-box/combo-box-keys.constant";

/** The demo's keys. */
const K = COMBO_BOX_KEYS.combo_box;

/** The grid that lays the samples out in a wrapping row of fixed-width fields. */
const ROW = "flex flex-wrap items-start gap-6";

/** The width of a sample field, so its label and error wrap the same way in every sample. */
const SAMPLE = "w-72";

/** Combo box: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  /** The countries of the samples, and of the pretend server. */
  const COUNTRIES = [
    { id: "ar", label: t(K.sample.argentina) },
    { id: "ad", label: t(K.sample.andorra), isDisabled: true },
    { id: "au", label: t(K.sample.australia) },
    { id: "at", label: t(K.sample.austria) },
    { id: "be", label: t(K.sample.belgium) },
    { id: "br", label: t(K.sample.brazil) },
    { id: "ca", label: t(K.sample.canada) },
    { id: "cl", label: t(K.sample.chile) },
    { id: "cz", label: t(K.sample.czechia) },
    { id: "dk", label: t(K.sample.denmark) },
    { id: "eg", label: t(K.sample.egypt) },
    { id: "fi", label: t(K.sample.finland) },
    { id: "fr", label: t(K.sample.france) },
    { id: "de", label: t(K.sample.germany) },
    { id: "gr", label: t(K.sample.greece) },
    { id: "in", label: t(K.sample.india) },
    { id: "it", label: t(K.sample.italy) },
    { id: "jp", label: t(K.sample.japan) },
    { id: "ke", label: t(K.sample.kenya) },
    { id: "mx", label: t(K.sample.mexico) },
    { id: "nl", label: t(K.sample.netherlands) },
    { id: "no", label: t(K.sample.norway) },
    { id: "es", label: t(K.sample.spain) },
    { id: "se", label: t(K.sample.sweden) },
  ] as const;
  return (
    <div className={ROW}>
      <UiComboBox
        items={COUNTRIES}
        label={t(K.country_label)}
        placeholder={t(K.country_placeholder)}
        className={SAMPLE}
      />
      <UiComboBox
        items={COUNTRIES}
        label={t(K.described_label)}
        placeholder={t(K.described_placeholder)}
        description={t(K.description)}
        className={SAMPLE}
      />
      <UiComboBox
        items={COUNTRIES}
        aria-label={t(K.hidden_label_name)}
        placeholder={t(K.hidden_label_name)}
        className={SAMPLE}
      />
    </div>
  );
}
