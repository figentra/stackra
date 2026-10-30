/**
 * Stackra file contract:
 * Purpose: the "storage" demo of the native StackedMeter: storage by file type.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (wave 3b).
 */
import { StackedMeter, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { STACKED_METER_DEMO_KEYS } from "#src/demos/free/stacked-meter/stacked-meter-demo-keys.constant";

/** The demo's keys. */
const K = STACKED_METER_DEMO_KEYS.demo_free.stacked_meter.storage;

/** 39 GB of a 50 GB plan, by file type. */
export default function Storage() {
  const t = useCatalogueText(MESSAGES.en);
  const parts = [
    ["videos", 20.1],
    ["photos", 12.4],
    ["documents", 4.3],
    ["other", 2.2],
  ] as const;
  return (
    <StackedMeter
      label={t(K.label)}
      max={50}
      valueFormat={{ style: "unit", unit: "gigabyte", maximumFractionDigits: 1 }}
      segments={parts.map(([key, value]) => ({ key, label: t(K[key]), value }))}
    />
  );
}
