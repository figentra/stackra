/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Select: Choose a status and the page reports its key; Clear sets the value to
 *          null from outside, which empties the field.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0055; ADR 0060 (light, dark, RTL).
 */
import { Button, Select as UiSelect, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SELECT_KEYS } from "#src/demos/free/select/select-keys.constant";

/** The demo's keys. */
const K = SELECT_KEYS.select;

/** The grid that lays the samples out in a wrapping row of fixed-width fields. */
const ROW = "flex flex-wrap items-start gap-6";

/** The width of a sample field, so its label and error wrap the same way in every sample. */
const SAMPLE = "w-72";

/** Select: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  /** The choices of the order status samples; Void is shown but refused. */
  const STATUSES = [
    { id: "draft", label: t(K.sample.draft) },
    { id: "sent", label: t(K.sample.sent) },
    { id: "paid", label: t(K.sample.paid) },
    { id: "void", label: t(K.sample.void), isDisabled: true },
  ] as const;
  const [status, setStatus] = useState<string | null>(null);

  return (
    <div className="grid gap-6">
      <div className={ROW}>
        <UiSelect
          items={STATUSES}
          label={t(K.live_label)}
          placeholder={t(K.status_placeholder)}
          value={status}
          onChange={setStatus}
          className={SAMPLE}
        />
        <Button variant="secondary" onPress={() => setStatus(null)}>
          {t(K.clear)}
        </Button>
      </div>
      <Text role="status" data-testid="select-chosen" tone="muted">
        {t(K.chosen, { key: status ?? "none" })}
      </Text>
    </div>
  );
}
