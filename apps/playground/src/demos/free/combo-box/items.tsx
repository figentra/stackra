/**
 * Stackra file contract:
 * Purpose: the "items" demo of the web Combo box: Each choice can carry a second line, and a choice can be shown but
 *          refused: Andorra is disabled.
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

/** Combo box: Items. */
export default function Items() {
  const t = useCatalogueText(MESSAGES.en);
  /** The offices of the sample whose choices carry a second line. */
  const OFFICES = [
    { id: "cai", label: t(K.sample.cairo), description: t(K.sample.engineering_and_support) },
    { id: "ber", label: t(K.sample.berlin), description: t(K.sample.sales_for_europe) },
    { id: "ldn", label: t(K.sample.london), description: t(K.sample.head_office) },
    { id: "nyc", label: t(K.sample.new_york), description: t(K.sample.sales_for_the_americas) },
    {
      id: "old",
      label: t(K.sample.lisbon),
      description: t(K.sample.closed_in_2024),
      isDisabled: true,
    },
  ] as const;
  return (
    <div className={ROW}>
      <UiComboBox
        items={OFFICES}
        label={t(K.rich_label)}
        placeholder={t(K.rich_placeholder)}
        className={SAMPLE}
      />
    </div>
  );
}
