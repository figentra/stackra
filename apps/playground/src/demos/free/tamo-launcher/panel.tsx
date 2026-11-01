/**
 * Stackra file contract:
 * Purpose: the "panel" demo of the web tamo-launcher: the Ask Tamo launcher with its shortcut, opening the side panel that knows the screen (offline mock).
 * Boundary: a demo with no props: @stackra/ui, @stackra/ai's offline mock client and local state only; every word
 *           from the catalogue. The same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          ADR 0507 (Ask Tamo).
 */
import { createMockTamoClient, TamoProvider } from "@stackra/ai/react";
import { TamoLauncher, Text, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { TAMO_LAUNCHER_KEYS } from "#src/demos/free/tamo-launcher/tamo-launcher-keys.constant";

/** The demo's keys. */
const K = TAMO_LAUNCHER_KEYS.tamo_launcher;
/** The offline client: plain rules, no keys, no network. */
const CLIENT = createMockTamoClient();

/** Tamo launcher: panel. */
export default function Panel() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <TamoProvider client={CLIENT} screen="orders" screenLabel={t(K.screen)}>
      <div className="grid gap-3">
        <TamoLauncher />
        <Text type="small" tone="muted">
          {t(K.hint)}
        </Text>
      </div>
    </TamoProvider>
  );
}
