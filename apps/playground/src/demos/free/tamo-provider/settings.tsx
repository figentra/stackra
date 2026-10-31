/**
 * Stackra file contract:
 * Purpose: the "settings" demo of the web tamo-provider: TamoProvider over a screen with the launcher and a reply field, and the workspace's switch turning Tamo off without code.
 * Boundary: a demo with no props: @stackra/ui, @stackra/ai's offline mock client and local state only; every word
 *           from the catalogue. The same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          ADR 0507 (Ask Tamo); ADR 0504 (module UI kits).
 */
import { createMockTamoClient, TamoProvider } from "@stackra/ai/react";
import { Switch, TamoLauncher, Text, TextArea, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { TAMO_PROVIDER_KEYS } from "#src/demos/free/tamo-provider/tamo-provider-keys.constant";

/** The demo's keys. */
const K = TAMO_PROVIDER_KEYS.tamo_provider;
/** The offline client: plain rules, no keys, no network. */
const CLIENT = createMockTamoClient();

/** Tamo provider: settings. */
export default function Settings() {
  const t = useCatalogueText(MESSAGES.en);
  // In a product this is the workspace's dashboard setting; here a switch stands in for it.
  const [isEnabled, setEnabled] = useState(true);
  return (
    <div className="grid max-w-lg gap-4">
      <Switch label={t(K.switch)} value={isEnabled} onChange={setEnabled} />
      <TamoProvider
        client={CLIENT}
        settings={{ isEnabled }}
        screen="messages"
        screenLabel={t(K.screen)}
      >
        <div className="grid gap-3">
          <TamoLauncher />
          <TextArea label={t(K.label)} name="reply" defaultValue={t(K.text)} rows={3} />
          {isEnabled ? null : (
            <Text type="small" tone="muted">
              {t(K.off)}
            </Text>
          )}
        </div>
      </TamoProvider>
    </div>
  );
}
