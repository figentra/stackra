/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web tamo-button: the Ask Tamo button in its three sizes, icon-only, working with the shimmer, and disabled.
 * Boundary: a demo with no props: @stackra/ui, @stackra/ai's offline mock client and local state only; every word
 *           from the catalogue. The same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          ADR 0507 (Ask Tamo).
 */
import { TamoButton, Text, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { TAMO_BUTTON_KEYS } from "#src/demos/free/tamo-button/tamo-button-keys.constant";

/** The demo's keys. */
const K = TAMO_BUTTON_KEYS.tamo_button;

/** Tamo button: states. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-4">
      <Text type="small" tone="muted">
        {t(K.sizes)}
      </Text>
      <div className="flex flex-wrap items-center gap-3">
        <TamoButton size="sm" />
        <TamoButton />
        <TamoButton size="lg" />
      </div>
      <Text type="small" tone="muted">
        {t(K.forms)}
      </Text>
      <div className="flex flex-wrap items-center gap-3">
        <TamoButton isIconOnly />
        <TamoButton label={t(K.improve)} status="working" />
        <TamoButton isDisabled />
      </div>
    </div>
  );
}
