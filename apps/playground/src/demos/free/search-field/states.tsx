/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web Search field: Each state of the field, with a value where the clear button
 *          matters. Disabled and read-only keep their text.
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

/** Search field: States. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className={ROW}>
      <UiSearchField label={t(K.with_value)} defaultValue={t(K.sample_text)} className={SAMPLE} />
      <UiSearchField
        label={t(K.required)}
        placeholder={t(K.placeholder)}
        isRequired
        className={SAMPLE}
      />
      <UiSearchField
        label={t(K.invalid)}
        defaultValue="ab"
        isInvalid
        errorMessage={t(K.invalid_error)}
        className={SAMPLE}
      />
      <UiSearchField
        label={t(K.disabled)}
        defaultValue={t(K.sample_text)}
        isDisabled
        className={SAMPLE}
      />
      <UiSearchField
        label={t(K.read_only)}
        defaultValue={t(K.sample_text)}
        isReadOnly
        className={SAMPLE}
      />
      <UiSearchField
        label={t(K.loading)}
        defaultValue={t(K.sample_text)}
        isLoading
        className={SAMPLE}
      />
    </div>
  );
}
