/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Search field: A visible label, a label with a description, and a field with
 *          no visible label that is named for assistive technology.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0055; ADR 0060 (light, dark, RTL).
 */
import { SearchField as UiSearchField, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SEARCH_FIELD_KEYS } from "#src/demos/free/search-field/search-field-keys.constant";

/** The demo's keys. */
const K = SEARCH_FIELD_KEYS.search_field;

/** The grid that lays the samples out in a wrapping row of fixed-width fields. */
const ROW = "flex flex-wrap items-start gap-6";

/** The width of a sample field, so its label and error wrap the same way in every sample. */
const SAMPLE = "w-72";

/** Search field: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className={ROW}>
      <UiSearchField label={t(K.label)} placeholder={t(K.placeholder)} className={SAMPLE} />
      <UiSearchField
        label={t(K.described_label)}
        placeholder={t(K.described_placeholder)}
        description={t(K.description)}
        className={SAMPLE}
      />
      <UiSearchField
        aria-label={t(K.hidden_label_name)}
        placeholder={t(K.hidden_label_placeholder)}
        className={SAMPLE}
      />
    </div>
  );
}
