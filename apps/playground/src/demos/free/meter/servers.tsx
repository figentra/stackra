/**
 * Stackra file contract:
 * Purpose: the "servers" demo of the web Meter: storage, CPU and disk, green while low, amber then red as they fill.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Meter, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { METER_KEYS } from "#src/demos/free/meter/meter-keys.constant";

/** The demo's keys. */
const K = METER_KEYS.meter.servers;

/** Meter: storage, CPU and disk, green while low, amber then red as they fill. */
export default function Servers() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid w-full max-w-md gap-5">
      <Meter label={t(K.storage)} value={42} low={70} high={90} optimum={0} />
      <Meter label={t(K.cpu)} value={78} low={70} high={90} optimum={0} />
      <Meter label={t(K.disk)} value={96} low={70} high={90} optimum={0} />
    </div>
  );
}
