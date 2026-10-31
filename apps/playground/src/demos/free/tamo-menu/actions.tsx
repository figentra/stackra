/**
 * Stackra file contract:
 * Purpose: the "actions" demo of the web tamo-menu: Tamo's text actions on a sentence, with a module's own action, reporting the one chosen.
 * Boundary: a demo with no props: @stackra/ui, @stackra/ai's offline mock client and local state only; every word
 *           from the catalogue. The same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          ADR 0507 (Ask Tamo).
 */
import { TamoMenu, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { TAMO_MENU_KEYS } from "#src/demos/free/tamo-menu/tamo-menu-keys.constant";

/** The demo's keys. */
const K = TAMO_MENU_KEYS.tamo_menu;

/** Tamo menu: actions. */
export default function Actions() {
  const t = useCatalogueText(MESSAGES.en);
  const [chosen, setChosen] = useState("");
  return (
    <div className="grid max-w-md gap-3">
      <Text dir="auto">{t(K.text)}</Text>
      <div className="flex items-center gap-3">
        <TamoMenu
          text={t(K.text)}
          hasContinue
          actions={[{ id: "seo", label: t(K.seo), description: t(K.seo_hint) }]}
          onAction={setChosen}
          size="md"
        />
        <Text type="small" tone="muted" role="status">
          {chosen === "" ? "" : t(K.chosen, { action: chosen })}
        </Text>
      </div>
    </div>
  );
}
