/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web Select: Each state of the field. Disabled and read-only keep their value;
 *          read-only keeps focus and never opens.
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

/** The Select demo: states. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  /** The choices of the order status samples; Void is shown but refused. */
  const STATUSES = [
    { id: "draft", label: t(K.sample.draft) },
    { id: "sent", label: t(K.sample.sent) },
    { id: "paid", label: t(K.sample.paid) },
    { id: "void", label: t(K.sample.void), isDisabled: true },
  ] as const;
  return (
    <div className="grid gap-6">
      <div className={ROW}>
        <UiSelect items={STATUSES} label={t(K.with_value)} defaultValue="sent" className={SAMPLE} />
        <UiSelect
          items={STATUSES}
          label={t(K.required)}
          placeholder={t(K.status_placeholder)}
          isRequired
          className={SAMPLE}
        />
        <UiSelect
          items={STATUSES}
          label={t(K.invalid)}
          placeholder={t(K.status_placeholder)}
          isInvalid
          errorMessage={t(K.invalid_error)}
          className={SAMPLE}
        />
        <UiSelect
          items={STATUSES}
          label={t(K.disabled)}
          defaultValue="sent"
          isDisabled
          className={SAMPLE}
        />
        <UiSelect
          items={STATUSES}
          label={t(K.read_only)}
          defaultValue="sent"
          isReadOnly
          className={SAMPLE}
        />
      </div>
      <UiSelect
        items={STATUSES}
        label={t(K.full_width)}
        description={t(K.full_width_note)}
        placeholder={t(K.status_placeholder)}
        isFullWidth
      />
    </div>
  );
}
