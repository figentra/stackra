/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Select: A visible label, a label with a description and a placeholder, and a
 *          field with no visible label that is named for assistive technology.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0055; ADR 0060 (light, dark, RTL).
 */
import { Select as UiSelect, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SELECT_KEYS } from "#src/demos/free/select/select-keys.constant";

/** The demo's keys. */
const K = SELECT_KEYS.select;

/** The grid that lays the samples out in a wrapping row of fixed-width fields. */
const ROW = "flex flex-wrap items-start gap-6";

/** The width of a sample field, so its label and error wrap the same way in every sample. */
const SAMPLE = "w-72";

/** Select: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  /** The choices of the order status samples; Void is shown but refused. */
  const STATUSES = [
    { id: "draft", label: t(K.sample.draft) },
    { id: "sent", label: t(K.sample.sent) },
    { id: "paid", label: t(K.sample.paid) },
    { id: "void", label: t(K.sample.void), isDisabled: true },
  ] as const;
  /** The shipping methods of the described sample. */
  const METHODS = [
    { id: "post", label: t(K.sample.post) },
    { id: "courier", label: t(K.sample.courier) },
    { id: "pickup", label: t(K.sample.pickup) },
  ] as const;
  /** The sort orders of the sample that has no visible label. */
  const SORTS = [
    { id: "newest", label: t(K.sample.newest_first) },
    { id: "oldest", label: t(K.sample.oldest_first) },
  ] as const;
  return (
    <div className={ROW}>
      <UiSelect
        items={STATUSES}
        label={t(K.status_label)}
        placeholder={t(K.status_placeholder)}
        className={SAMPLE}
      />
      <UiSelect
        items={METHODS}
        label={t(K.described_label)}
        placeholder={t(K.described_placeholder)}
        description={t(K.description)}
        className={SAMPLE}
      />
      <UiSelect
        items={SORTS}
        aria-label={t(K.hidden_label_name)}
        defaultValue="newest"
        className={SAMPLE}
      />
    </div>
  );
}
