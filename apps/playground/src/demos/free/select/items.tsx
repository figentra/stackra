/**
 * Stackra file contract:
 * Purpose: the "items" demo of the web Select: Each choice can carry a second line, and a choice can be shown but
 *          refused: Void is disabled.
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

/** Select: Items. */
export default function Items() {
  const t = useCatalogueText(MESSAGES.en);
  /** The plans of the sample whose choices carry a second line. */
  const PLANS = [
    { id: "free", label: t(K.sample.free), description: t(K.sample.for_one_person_up_to) },
    { id: "team", label: t(K.sample.team), description: t(K.sample.for_a_group_with_shared) },
    { id: "scale", label: t(K.sample.scale), description: t(K.sample.for_a_company_with_audit) },
    {
      id: "legacy",
      label: t(K.sample.legacy),
      description: t(K.sample.no_longer_sold),
      isDisabled: true,
    },
  ] as const;
  return (
    <div className={ROW}>
      <UiSelect
        items={PLANS}
        label={t(K.rich_label)}
        placeholder={t(K.rich_placeholder)}
        className={SAMPLE}
      />
    </div>
  );
}
