/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Segmented control: a report range with a sliding thumb.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL).
 */
import type { SegmentItem } from "@stackra/ui/contracts";
import { SegmentedControl, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SEGMENTED_CONTROL_KEYS } from "#src/demos/free/segmented-control/segmented-control-keys.constant";

/** The demo's keys. */
const K = SEGMENTED_CONTROL_KEYS.segmented_control;

/** Segmented control: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const items: readonly SegmentItem[] = [
    { id: "day", label: t(K.day) },
    { id: "week", label: t(K.week) },
    { id: "month", label: t(K.month) },
  ];
  const [range, setRange] = useState("week");
  return (
    <div className="grid justify-items-start gap-3">
      <SegmentedControl
        label={t(K.label)}
        items={items}
        selectedKey={range}
        onSelectionChange={setRange}
      />
      <Text type="small" tone="muted">
        {t(K.showing, { range: items.find((item) => item.id === range)?.label ?? "" })}
      </Text>
    </div>
  );
}
