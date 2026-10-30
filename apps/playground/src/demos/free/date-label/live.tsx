/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web DateLabel: move a purchase order's due date a day at a time and watch it go from
 *          due to due soon to overdue, with one pulse as it turns overdue.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { Button, DateLabel, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DATE_LABEL_KEYS } from "#src/demos/free/date-label/date-label-keys.constant";

/** The demo's keys. */
const K = DATE_LABEL_KEYS.date_label;

/** A day `offset` days from today. */
const dayFromToday = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date;
};

/** DateLabel: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [offset, setOffset] = useState(5);
  return (
    <div className="grid max-w-sm gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Text>{t(K.due_date)}</Text>
        <span role="status">
          <DateLabel kind="due" date={dayFromToday(offset)} size="md" />
        </span>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" onPress={() => setOffset(offset - 1)}>
          {t(K.earlier)}
        </Button>
        <Button variant="secondary" onPress={() => setOffset(offset + 1)}>
          {t(K.later)}
        </Button>
      </div>
    </div>
  );
}
