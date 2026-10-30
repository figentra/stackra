/**
 * Stackra file contract:
 * Purpose: the "storage" demo of the web StackedMeter: storage by file type.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { StackedMeter, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { STACKED_METER_KEYS } from "#src/demos/free/stacked-meter/stacked-meter-keys.constant";

/** The demo's keys. */
const K = STACKED_METER_KEYS.stacked_meter;

/** Stacked meter: 39 GB of a 50 GB plan, by file type. */
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
      className="w-full max-w-md"
      label={t(K.label)}
      max={50}
      valueFormat={{ style: "unit", unit: "gigabyte", maximumFractionDigits: 1 }}
      segments={parts.map(([key, value]) => ({ key, label: t(K[key]), value }))}
    />
  );
}
